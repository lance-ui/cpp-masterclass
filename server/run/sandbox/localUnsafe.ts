import { spawnLimited } from "../spawnLimited.js";
import type { ExecuteLimits } from "../types.js";

/**
 * DEV ONLY — runs g++ / binary on the host with no isolation.
 * Requires ALLOW_UNSAFE_LOCAL_EXEC=true.
 */
export async function runUnsafeLocal(
  workDir: string,
  argv: string[],
  opts: {
    stdin?: string;
    timeoutMs: number;
    maxOutputBytes: number;
    limits: ExecuteLimits;
  },
) {
  console.warn(
    "[run] UNSAFE LOCAL EXEC — no sandbox. Do not use in production.",
  );
  return spawnLimited({
    argv,
    cwd: workDir,
    stdin: opts.stdin,
    timeoutMs: opts.timeoutMs,
    maxOutputBytes: opts.maxOutputBytes,
    processGroup: true,
    env: {
      ...process.env,
      PATH: process.env.PATH || "/usr/bin:/bin",
    },
  });
}
