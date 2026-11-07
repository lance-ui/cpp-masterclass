import type { ExecuteLimits } from "./types.js";

function intEnv(name: string, fallback: number): number {
  const raw = process.env[name];
  if (!raw) return fallback;
  const n = Number(raw);
  return Number.isFinite(n) && n > 0 ? n : fallback;
}

export function loadExecuteLimits(): ExecuteLimits {
  return {
    maxCodeBytes: intEnv("MAX_CODE_BYTES", 50 * 1024),
    maxStdinBytes: intEnv("MAX_STDIN_BYTES", 10 * 1024),
    compileTimeoutMs: intEnv("COMPILE_TIMEOUT_MS", 10_000),
    runTimeoutMs: intEnv("RUN_TIMEOUT_MS", 5_000),
    maxOutputBytes: intEnv("MAX_OUTPUT_BYTES", 64 * 1024),
    maxConcurrentRuns: intEnv("MAX_CONCURRENT_RUNS", 2),
    rateLimitPerMinute: intEnv("RUN_RATE_LIMIT_PER_MINUTE", 20),
    memoryMb: intEnv("SANDBOX_MEMORY_MB", 128),
    cpus: intEnv("SANDBOX_CPUS", 1) === 1 ? 0.5 : intEnv("SANDBOX_CPUS", 1),
    pidsLimit: intEnv("SANDBOX_PIDS_LIMIT", 64),
    interactiveTimeoutMs: intEnv("INTERACTIVE_TIMEOUT_MS", 30_000),
    interactiveIdleTimeoutMs: intEnv("INTERACTIVE_IDLE_TIMEOUT_MS", 60_000),
    interactiveStdinChunkBytes: intEnv("INTERACTIVE_STDIN_CHUNK_BYTES", 4 * 1024),
    interactiveStdinTotalBytes: intEnv(
      "INTERACTIVE_STDIN_TOTAL_BYTES",
      64 * 1024,
    ),
  };
}

/** Cap and flag truncated output. */
export function truncateOutput(
  text: string,
  maxBytes: number,
): { text: string; truncated: boolean } {
  const buf = Buffer.from(text, "utf8");
  if (buf.byteLength <= maxBytes) {
    return { text, truncated: false };
  }
  const sliced = buf.subarray(0, maxBytes).toString("utf8");
  return {
    text: `${sliced}\n… [output truncated at ${maxBytes} bytes]`,
    truncated: true,
  };
}

/** Strip host temp paths from compiler/runtime messages. */
export function redactPaths(text: string, workDir: string): string {
  if (!text) return text;
  const escaped = workDir.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
  return text
    .replace(new RegExp(escaped, "g"), ".")
    .replace(/\/tmp\/cpp-run-[a-z0-9_-]+/gi, ".")
    .replace(/\/var\/folders\/[^\s:]+/g, ".")
    .replace(/\/home\/[^\s:/]+/g, "~");
}
