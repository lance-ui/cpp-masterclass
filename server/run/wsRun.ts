import type { IncomingMessage, Server as HttpServer } from "node:http";
import type { Duplex } from "node:stream";
import { WebSocketServer, type WebSocket } from "ws";
import type { RequestHandler } from "express";
import {
  RunValidationError,
  SandboxUnavailableError,
} from "./execute.js";
import { prepareInteractiveSession } from "./interactiveExecute.js";
import { loadExecuteLimits } from "./limits.js";
import { ConcurrencyGate, RateLimiter } from "./rateLimit.js";
import type { PublicUser } from "../usersStore.js";

type SessionUserFn = (req: IncomingMessage & { session?: { userId?: string } }) => PublicUser | null;

interface ClientStart {
  type: "start";
  code?: string;
  options?: { memoryChecks?: boolean };
}

interface ClientStdin {
  type: "stdin";
  data?: string;
}

interface ClientEof {
  type: "eof";
}

interface ClientKill {
  type: "kill";
}

type ClientMessage = ClientStart | ClientStdin | ClientEof | ClientKill;

function send(ws: WebSocket, payload: unknown) {
  if (ws.readyState === ws.OPEN) {
    ws.send(JSON.stringify(payload));
  }
}

function originAllowed(origin: string, allowed: string): boolean {
  if (origin === allowed) return true;
  try {
    const a = new URL(allowed);
    const o = new URL(origin);
    const norm = (h: string) => (h === "localhost" ? "127.0.0.1" : h);
    return (
      norm(a.hostname) === norm(o.hostname) &&
      (a.port || defaultPort(a.protocol)) ===
        (o.port || defaultPort(o.protocol))
    );
  } catch {
    return false;
  }
}

function defaultPort(protocol: string): string {
  return protocol === "https:" ? "443" : "80";
}

function parseMessage(raw: WebSocket.RawData): ClientMessage | null {
  try {
    const text =
      typeof raw === "string"
        ? raw
        : Buffer.isBuffer(raw)
          ? raw.toString("utf8")
          : Array.isArray(raw)
            ? Buffer.concat(raw).toString("utf8")
            : String(raw);
    const msg = JSON.parse(text) as ClientMessage;
    if (!msg || typeof msg !== "object" || typeof msg.type !== "string") {
      return null;
    }
    return msg;
  } catch {
    return null;
  }
}

/**
 * Attach /api/run/ws upgrade handler.
 * Uses the same express-session middleware for cookie auth + Origin check.
 */
export function attachRunWebSocket(opts: {
  server: HttpServer;
  sessionMiddleware: RequestHandler;
  sessionUser: SessionUserFn;
  allowedOrigin: string;
  concurrencyGate: ConcurrencyGate;
  rateLimiter: RateLimiter;
}): void {
  const { server, sessionMiddleware, sessionUser, allowedOrigin } = opts;
  const limits = loadExecuteLimits();
  const wss = new WebSocketServer({ noServer: true });
  /** One live interactive process per user. */
  const activeByUser = new Map<string, { kill: () => void }>();

  server.on("upgrade", (req, socket, head) => {
    const url = new URL(req.url || "/", "http://127.0.0.1");
    if (url.pathname !== "/api/run/ws") {
      return;
    }

    const origin = req.headers.origin;
    if (origin && !originAllowed(origin, allowedOrigin)) {
      socket.write("HTTP/1.1 403 Forbidden\r\nConnection: close\r\n\r\n");
      socket.destroy();
      return;
    }

    // Run express-session on the upgrade request to populate req.session
    const fakeRes = {
      getHeader: () => undefined,
      setHeader: () => undefined,
      end: () => undefined,
    };
    sessionMiddleware(
      req as never,
      fakeRes as never,
      ((err?: unknown) => {
        if (err) {
          socket.write("HTTP/1.1 500 Internal Server Error\r\nConnection: close\r\n\r\n");
          socket.destroy();
          return;
        }
        const user = sessionUser(req as never);
        if (!user) {
          socket.write("HTTP/1.1 401 Unauthorized\r\nConnection: close\r\n\r\n");
          socket.destroy();
          return;
        }
        wss.handleUpgrade(req, socket as Duplex, head, (ws) => {
          wss.emit("connection", ws, req, user);
        });
      }) as never,
    );
  });

  wss.on(
    "connection",
    (ws: WebSocket, _req: IncomingMessage, user: PublicUser) => {
      let releaseGate: (() => void) | null = null;
      let stdinTotal = 0;
      let sessionKill: (() => void) | null = null;
      let running = false;

      const endUserSlot = () => {
        if (activeByUser.get(user.id)?.kill === sessionKill) {
          activeByUser.delete(user.id);
        }
        sessionKill = null;
        if (releaseGate) {
          releaseGate();
          releaseGate = null;
        }
        running = false;
      };

      ws.on("close", () => {
        sessionKill?.();
        endUserSlot();
      });

      ws.on("message", (raw) => {
        const msg = parseMessage(raw);
        if (!msg) {
          send(ws, { type: "error", message: "Invalid message." });
          return;
        }

        if (msg.type === "kill") {
          sessionKill?.();
          return;
        }

        if (msg.type === "eof") {
          // handled only while process lives — attached below
          return;
        }

        if (msg.type === "stdin") {
          return;
        }

        if (msg.type !== "start") {
          send(ws, { type: "error", message: "Unknown message type." });
          return;
        }

        if (running) {
          send(ws, {
            type: "error",
            message: "A run is already in progress on this connection.",
          });
          return;
        }

        void (async () => {
          if (!opts.rateLimiter.allow(user.id)) {
            send(ws, {
              type: "error",
              message: `Rate limit: max ${limits.rateLimitPerMinute} runs per minute.`,
            });
            return;
          }

          // Replace any prior session for this user
          const prior = activeByUser.get(user.id);
          prior?.kill();

          const acquired = opts.concurrencyGate.tryAcquire();
          if (!acquired) {
            send(ws, {
              type: "error",
              message:
                "Compiler busy — too many concurrent runs. Try again shortly.",
            });
            return;
          }
          releaseGate = acquired;
          running = true;
          stdinTotal = 0;

          let cleaned = false;
          const cleanupFns: Array<() => void | Promise<void>> = [];

          const killAll = () => {
            for (const fn of cleanupFns) {
              try {
                void fn();
              } catch {
                /* ignore */
              }
            }
          };
          sessionKill = killAll;
          activeByUser.set(user.id, { kill: killAll });

          try {
            const session = await prepareInteractiveSession({
              code: msg.code || "",
              memoryChecks: Boolean(msg.options?.memoryChecks),
            });
            cleanupFns.push(() => {
              session.process?.kill();
            });
            cleanupFns.push(() => session.cleanup());

            send(ws, {
              type: "compile",
              ok: session.compile.ok,
              diagnostics: session.compile.diagnostics,
              stderr: session.compile.stderr,
              stdout: session.compile.stdout,
              timedOut: session.compile.timedOut,
              durationMs: session.compile.durationMs,
              sandbox: {
                mode: session.sandboxMode,
                memoryChecks: session.memoryChecks,
              },
            });

            if (!session.compile.ok || !session.process) {
              if (!cleaned) {
                cleaned = true;
                await session.cleanup();
                endUserSlot();
              }
              return;
            }

            const proc = session.process;

            const onStdout = (data: string) => {
              send(ws, { type: "stdout", data: session.redact(data) });
            };
            const onStderr = (data: string) => {
              send(ws, { type: "stderr", data: session.redact(data) });
            };
            const onExit = (info: {
              exitCode: number | null;
              signal: string | null;
              timedOut: boolean;
              truncated: boolean;
              durationMs: number;
            }) => {
              send(ws, {
                type: "exit",
                code: info.exitCode,
                signal: info.signal,
                timedOut: info.timedOut,
                truncated: info.truncated,
                durationMs: info.durationMs,
              });
              void (async () => {
                if (!cleaned) {
                  cleaned = true;
                  await session.cleanup();
                  endUserSlot();
                }
              })();
            };

            proc.on("stdout", onStdout);
            proc.on("stderr", onStderr);
            proc.on("exit", onExit);

            const onClientMsg = (raw2: WebSocket.RawData) => {
              const m = parseMessage(raw2);
              if (!m) return;
              if (m.type === "stdin") {
                const data = typeof m.data === "string" ? m.data : "";
                const bytes = Buffer.byteLength(data, "utf8");
                if (bytes > limits.interactiveStdinChunkBytes) {
                  send(ws, {
                    type: "error",
                    message: `stdin chunk exceeds ${limits.interactiveStdinChunkBytes} bytes.`,
                  });
                  return;
                }
                if (stdinTotal + bytes > limits.interactiveStdinTotalBytes) {
                  send(ws, {
                    type: "error",
                    message: `Total stdin exceeds ${limits.interactiveStdinTotalBytes} bytes.`,
                  });
                  killAll();
                  return;
                }
                stdinTotal += bytes;
                if (!proc.writeStdin(data)) {
                  send(ws, {
                    type: "error",
                    message: "Process stdin is closed.",
                  });
                }
                return;
              }
              if (m.type === "eof") {
                proc.endStdin();
                return;
              }
              if (m.type === "kill") {
                killAll();
              }
            };

            ws.on("message", onClientMsg);
            cleanupFns.push(() => {
              ws.off("message", onClientMsg);
              proc.off("stdout", onStdout);
              proc.off("stderr", onStderr);
              proc.off("exit", onExit);
            });
          } catch (err) {
            if (err instanceof RunValidationError) {
              send(ws, { type: "error", message: err.message });
            } else if (err instanceof SandboxUnavailableError) {
              send(ws, { type: "error", message: err.message });
            } else {
              console.error("[ws/run]", err);
              send(ws, {
                type: "error",
                message: "Could not start the sandbox session.",
              });
            }
            killAll();
            if (!cleaned) {
              cleaned = true;
              endUserSlot();
            }
          }
        })();
      });
    },
  );
}
