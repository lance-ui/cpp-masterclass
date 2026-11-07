import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { EventEmitter } from "node:events";
import { pathExists } from "./spawnLimited.js";

export interface InteractiveSpawnEvents {
  stdout: (data: string) => void;
  stderr: (data: string) => void;
  exit: (info: {
    exitCode: number | null;
    signal: string | null;
    timedOut: boolean;
    truncated: boolean;
    durationMs: number;
  }) => void;
}

export interface InteractiveHandle {
  writeStdin(data: string): boolean;
  endStdin(): void;
  kill(): void;
  on: EventEmitter["on"];
  off: EventEmitter["off"];
}

export interface InteractiveSpawnOptions {
  argv: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  timeoutMs: number;
  idleTimeoutMs: number;
  maxOutputBytes: number;
  processGroup?: boolean;
  /** Keep stdin open (docker -i). */
  dockerInteractive?: boolean;
}

/**
 * Prefer a PTY so C++ iostream flushes prompts without endl (isatty).
 * Order: util-linux `script` → Python pty.spawn → stdbuf → bare argv.
 */
export async function wrapForLiveOutput(innerArgv: string[]): Promise<string[]> {
  if (!innerArgv.length) return innerArgv;
  if (await pathExists("/usr/bin/script")) {
    const cmd = innerArgv
      .map((a) => (/'/.test(a) ? `'${a.replace(/'/g, `'\\''`)}'` : a))
      .join(" ");
    // -q quiet, -e return child exit, -f flush, -c command
    return ["/usr/bin/script", "-qefc", cmd, "/dev/null"];
  }
  // Hosts without `script` (e.g. minimal Fedora) — Python stdlib pty
  if (await pathExists("/usr/bin/python3")) {
    return [
      "/usr/bin/python3",
      "-c",
      "import pty,sys; raise SystemExit(pty.spawn(sys.argv[1:]))",
      ...innerArgv,
    ];
  }
  if (await pathExists("/usr/bin/stdbuf")) {
    return ["/usr/bin/stdbuf", "-o0", "-e0", ...innerArgv];
  }
  return innerArgv;
}

/**
 * Long-lived sandboxed process with streamed stdio.
 */
export function spawnInteractive(
  options: InteractiveSpawnOptions,
): InteractiveHandle {
  const {
    argv,
    cwd,
    env,
    timeoutMs,
    idleTimeoutMs,
    maxOutputBytes,
    processGroup = true,
  } = options;
  if (!argv.length) {
    throw new Error("spawnInteractive requires a non-empty argv");
  }

  const emitter = new EventEmitter();
  const [cmd, ...args] = argv;
  const started = Date.now();
  let outputBytes = 0;
  let truncated = false;
  let timedOut = false;
  let settled = false;
  let idleTimer: ReturnType<typeof setTimeout> | null = null;

  const child: ChildProcessWithoutNullStreams = spawn(cmd!, args, {
    cwd,
    env,
    stdio: ["pipe", "pipe", "pipe"],
    detached: processGroup,
  });

  const clearIdle = () => {
    if (idleTimer) {
      clearTimeout(idleTimer);
      idleTimer = null;
    }
  };

  const bumpIdle = () => {
    clearIdle();
    if (settled) return;
    idleTimer = setTimeout(() => {
      timedOut = true;
      killTree();
    }, idleTimeoutMs);
  };

  const killTree = () => {
    try {
      if (processGroup && child.pid) {
        process.kill(-child.pid, "SIGKILL");
      } else {
        child.kill("SIGKILL");
      }
    } catch {
      try {
        child.kill("SIGKILL");
      } catch {
        /* ignore */
      }
    }
  };

  const finish = (
    exitCode: number | null,
    signal: NodeJS.Signals | null,
  ) => {
    if (settled) return;
    settled = true;
    clearTimeout(wallTimer);
    clearIdle();
    emitter.emit("exit", {
      exitCode,
      signal: signal ?? null,
      timedOut,
      truncated,
      durationMs: Date.now() - started,
    });
  };

  const wallTimer = setTimeout(() => {
    timedOut = true;
    killTree();
  }, timeoutMs);

  const onChunk = (stream: "stdout" | "stderr", chunk: Buffer) => {
    bumpIdle();
    if (outputBytes >= maxOutputBytes) {
      if (!truncated) {
        truncated = true;
        killTree();
      }
      return;
    }
    const room = maxOutputBytes - outputBytes;
    const slice =
      chunk.byteLength <= room ? chunk : chunk.subarray(0, room);
    outputBytes += slice.byteLength;
    emitter.emit(stream, slice.toString("utf8"));
    if (chunk.byteLength > room) {
      truncated = true;
      killTree();
    }
  };

  child.stdout.on("data", (c: Buffer) => onChunk("stdout", c));
  child.stderr.on("data", (c: Buffer) => onChunk("stderr", c));
  child.on("error", (err) => {
    emitter.emit("stderr", `\nspawn error: ${err.message}`);
    finish(null, null);
  });
  child.on("close", (code, signal) => finish(code, signal));

  bumpIdle();

  return {
    writeStdin(data: string) {
      if (settled || child.stdin.destroyed || child.stdin.writableEnded) {
        return false;
      }
      bumpIdle();
      try {
        child.stdin.write(data, "utf8");
        return true;
      } catch {
        return false;
      }
    },
    endStdin() {
      if (!child.stdin.destroyed && !child.stdin.writableEnded) {
        try {
          child.stdin.end();
        } catch {
          /* ignore */
        }
      }
    },
    kill() {
      timedOut = false;
      killTree();
    },
    on: emitter.on.bind(emitter),
    off: emitter.off.bind(emitter),
  };
}
