import type { CompileDiagnostic } from "./runApi";

export type SessionServerMessage =
  | {
      type: "compile";
      ok: boolean;
      diagnostics: CompileDiagnostic[];
      stderr: string;
      stdout?: string;
      timedOut?: boolean;
      durationMs?: number;
      sandbox?: { mode: string; memoryChecks: boolean };
    }
  | { type: "stdout"; data: string }
  | { type: "stderr"; data: string }
  | {
      type: "exit";
      code: number | null;
      signal: string | null;
      timedOut: boolean;
      truncated?: boolean;
      durationMs: number;
    }
  | { type: "error"; message: string };

export type ConsoleChunk =
  | { kind: "stdout"; text: string }
  | { kind: "stderr"; text: string }
  | { kind: "stdin"; text: string }
  | { kind: "system"; text: string };

function wsUrl(): string {
  const proto = window.location.protocol === "https:" ? "wss:" : "ws:";
  return `${proto}//${window.location.host}/api/run/ws`;
}

/**
 * Interactive sandboxed run over WebSocket.
 * Falls back to throwing if the socket cannot connect (caller may use POST /api/run).
 */
export class InteractiveRunSession {
  private ws: WebSocket | null = null;
  private closed = false;

  constructor(
    private readonly handlers: {
      onCompile: (msg: Extract<SessionServerMessage, { type: "compile" }>) => void;
      onChunk: (chunk: ConsoleChunk) => void;
      onExit: (msg: Extract<SessionServerMessage, { type: "exit" }>) => void;
      onError: (message: string) => void;
    },
  ) {}

  start(code: string, options?: { memoryChecks?: boolean }): Promise<void> {
    return new Promise((resolve, reject) => {
      const ws = new WebSocket(wsUrl());
      this.ws = ws;
      let opened = false;

      ws.onopen = () => {
        opened = true;
        ws.send(
          JSON.stringify({
            type: "start",
            code,
            options: { memoryChecks: Boolean(options?.memoryChecks) },
          }),
        );
        resolve();
      };

      ws.onerror = () => {
        if (!opened) {
          reject(new Error("WebSocket connection failed"));
        } else {
          this.handlers.onError("WebSocket connection error.");
        }
      };

      ws.onclose = () => {
        this.ws = null;
        if (!this.closed && opened) {
          // unexpected close without exit — surface softly
        }
      };

      ws.onmessage = (ev) => {
        let msg: SessionServerMessage;
        try {
          msg = JSON.parse(String(ev.data)) as SessionServerMessage;
        } catch {
          this.handlers.onError("Invalid server message.");
          return;
        }
        if (msg.type === "compile") {
          this.handlers.onCompile(msg);
          if (!msg.ok) {
            this.handlers.onChunk({
              kind: "stderr",
              text: msg.stderr || "Compile failed.",
            });
          }
          return;
        }
        if (msg.type === "stdout") {
          this.handlers.onChunk({ kind: "stdout", text: msg.data });
          return;
        }
        if (msg.type === "stderr") {
          this.handlers.onChunk({ kind: "stderr", text: msg.data });
          return;
        }
        if (msg.type === "exit") {
          this.closed = true;
          this.handlers.onExit(msg);
          ws.close();
          return;
        }
        if (msg.type === "error") {
          this.handlers.onError(msg.message);
        }
      };
    });
  }

  sendStdin(line: string) {
    const data = line.endsWith("\n") ? line : `${line}\n`;
    this.handlers.onChunk({ kind: "stdin", text: data });
    this.ws?.send(JSON.stringify({ type: "stdin", data }));
  }

  sendEof() {
    this.ws?.send(JSON.stringify({ type: "eof" }));
  }

  kill() {
    this.closed = true;
    try {
      this.ws?.send(JSON.stringify({ type: "kill" }));
    } catch {
      /* ignore */
    }
    this.ws?.close();
    this.ws = null;
  }
}
