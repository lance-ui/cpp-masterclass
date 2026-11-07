import { spawn, type ChildProcessWithoutNullStreams } from "node:child_process";
import { createRequire } from "node:module";

export interface SpawnLimitedResult {
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  durationMs: number;
}

export interface SpawnLimitedOptions {
  argv: string[];
  cwd?: string;
  env?: NodeJS.ProcessEnv;
  stdin?: string;
  timeoutMs: number;
  maxOutputBytes: number;
  /** Kill whole process group (Linux). */
  processGroup?: boolean;
}

function appendCapped(
  current: Buffer,
  chunk: Buffer,
  max: number,
): { buf: Buffer; truncated: boolean } {
  if (current.byteLength >= max) {
    return { buf: current, truncated: true };
  }
  const room = max - current.byteLength;
  if (chunk.byteLength <= room) {
    return { buf: Buffer.concat([current, chunk]), truncated: false };
  }
  return {
    buf: Buffer.concat([current, chunk.subarray(0, room)]),
    truncated: true,
  };
}

/**
 * Spawn a process with argv array only (never a shell string).
 * Times out by SIGKILL to the process group when possible.
 */
export function spawnLimited(
  options: SpawnLimitedOptions,
): Promise<SpawnLimitedResult & { truncated: boolean }> {
  const {
    argv,
    cwd,
    env,
    stdin,
    timeoutMs,
    maxOutputBytes,
    processGroup = true,
  } = options;
  if (!argv.length) {
    return Promise.reject(new Error("spawnLimited requires a non-empty argv"));
  }

  const [cmd, ...args] = argv;
  const started = Date.now();

  return new Promise((resolve) => {
    let stdoutBuf: Buffer = Buffer.alloc(0);
    let stderrBuf: Buffer = Buffer.alloc(0);
    let truncated = false;
    let timedOut = false;
    let settled = false;

    const child: ChildProcessWithoutNullStreams = spawn(cmd!, args, {
      cwd,
      env,
      stdio: ["pipe", "pipe", "pipe"],
      detached: processGroup,
    });

    const finish = (
      exitCode: number | null,
      signal: NodeJS.Signals | null,
    ) => {
      if (settled) return;
      settled = true;
      clearTimeout(timer);
      resolve({
        stdout: stdoutBuf.toString("utf8"),
        stderr: stderrBuf.toString("utf8"),
        exitCode,
        signal: signal ?? null,
        timedOut,
        durationMs: Date.now() - started,
        truncated,
      });
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

    const timer = setTimeout(() => {
      timedOut = true;
      killTree();
    }, timeoutMs);

    child.stdout.on("data", (chunk: Buffer) => {
      const next = appendCapped(stdoutBuf, chunk, maxOutputBytes);
      stdoutBuf = next.buf;
      if (next.truncated) truncated = true;
    });
    child.stderr.on("data", (chunk: Buffer) => {
      const next = appendCapped(stderrBuf, chunk, maxOutputBytes);
      stderrBuf = next.buf;
      if (next.truncated) truncated = true;
    });

    child.on("error", (err) => {
      stderrBuf = Buffer.concat([
        stderrBuf,
        Buffer.from(`\nspawn error: ${err.message}`),
      ]);
      finish(null, null);
    });

    child.on("close", (code, signal) => {
      finish(code, signal);
    });

    if (stdin != null && stdin.length > 0) {
      child.stdin.end(stdin, "utf8");
    } else {
      child.stdin.end();
    }
  });
}

/** Optional: try to apply prlimit wrapper if present. */
export function wrapWithPrlimit(
  argv: string[],
  opts: { cpuSec: number; asBytes: number; nproc: number; fsize: number },
): string[] {
  try {
    const require = createRequire(import.meta.url);
    // Existence check via which-like: if prlimit is on PATH, prepend it.
    // We don't import anything — just use /usr/bin/prlimit when it exists.
  } catch {
    /* ignore */
  }
  // Always try absolute path; spawn will fail fast if missing and caller can fall back.
  return [
    "/usr/bin/prlimit",
    `--cpu=${opts.cpuSec}`,
    `--as=${opts.asBytes}`,
    `--nproc=${opts.nproc}`,
    `--fsize=${opts.fsize}`,
    "--",
    ...argv,
  ];
}

export async function pathExists(bin: string): Promise<boolean> {
  const { access } = await import("node:fs/promises");
  const { constants } = await import("node:fs");
  try {
    await access(bin, constants.F_OK);
    return true;
  } catch {
    return false;
  }
}
