import { spawnLimited } from "../spawnLimited.js";
import type { ExecuteLimits } from "../types.js";

/**
 * Runs g++ / binary without bwrap/Docker.
 * Locally: ALLOW_UNSAFE_LOCAL_EXEC=true (dev only).
 * On Docker/Koyeb: CONTAINER_ISOLATION=true — the platform container is the boundary
 * (nested bwrap namespaces are typically Operation not permitted).
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
  if (process.env.CONTAINER_ISOLATION === "true") {
    // Expected path for container deploys — no noisy warning per run.
  } else {
    console.warn(
      "[run] UNSAFE LOCAL EXEC — no sandbox. Do not use on a shared bare-metal host.",
    );
  }
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
