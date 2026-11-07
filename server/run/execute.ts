import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseGppDiagnostics } from "./diagnostics.js";
import { loadExecuteLimits, redactPaths, truncateOutput } from "./limits.js";
import { detectSandboxCapabilities } from "./sandbox/detect.js";
import { runInBwrap } from "./sandbox/bwrap.js";
import { runInDocker } from "./sandbox/docker.js";
import { runUnsafeLocal } from "./sandbox/localUnsafe.js";
import type {
  CompileResult,
  RunRequestBody,
  RunResponse,
  RunResult,
  SandboxCapabilities,
  SandboxMode,
} from "./types.js";

let cachedCaps: SandboxCapabilities | null = null;

export async function getSandboxCapabilities(
  force = false,
): Promise<SandboxCapabilities> {
  if (!cachedCaps || force) {
    cachedCaps = await detectSandboxCapabilities();
  }
  return cachedCaps;
}

function gppArgv(memoryChecks: boolean): string[] {
  const base = [
    "/usr/bin/g++",
    "-std=c++20",
    "-O1",
    "-Wall",
    "-Wextra",
    "-o",
    "main",
    "main.cpp",
  ];
  if (memoryChecks) {
    return [
      "/usr/bin/g++",
      "-std=c++20",
      "-g",
      "-O1",
      "-Wall",
      "-Wextra",
      "-fsanitize=address,undefined",
      "-fno-omit-frame-pointer",
      "-o",
      "main",
      "main.cpp",
    ];
  }
  return base;
}

async function runSandboxed(
  mode: SandboxMode,
  workDir: string,
  argv: string[],
  opts: {
    stdin?: string;
    timeoutMs: number;
    maxOutputBytes: number;
  },
) {
  const limits = loadExecuteLimits();
  if (mode === "docker") {
    return runInDocker(workDir, argv, { ...opts, limits });
  }
  if (mode === "bwrap") {
    return runInBwrap(workDir, argv, { ...opts, limits });
  }
  return runUnsafeLocal(workDir, argv, { ...opts, limits });
}

export class RunValidationError extends Error {
  status: number;
  constructor(status: number, message: string) {
    super(message);
    this.status = status;
  }
}

export class SandboxUnavailableError extends Error {
  status = 503;
  constructor(message: string) {
    super(message);
  }
}

export async function executeCpp(
  body: RunRequestBody,
): Promise<RunResponse> {
  const limits = loadExecuteLimits();
  const caps = await getSandboxCapabilities();

  if (caps.mode === "none" && !caps.allowUnsafeLocal) {
    throw new SandboxUnavailableError(
      caps.message ||
        "Code execution sandbox is not available. See README for Docker/bwrap setup.",
    );
  }
  if (caps.mode === "none" && caps.allowUnsafeLocal) {
    if (process.env.CONTAINER_ISOLATION === "true") {
      console.log(
        "[run] in-container g++ (CONTAINER_ISOLATION) — nested bwrap not used",
      );
    } else {
      console.warn(
        "[run] ********************************************************************\n" +
          "[run] ALLOW_UNSAFE_LOCAL_EXEC — compiling/running WITHOUT a sandbox.\n" +
          "[run] ********************************************************************",
      );
    }
  }
  if (caps.mode !== "docker" && !caps.gppAvailable) {
    throw new SandboxUnavailableError(
      "g++ is not installed. Install gcc-c++ / g++, or build the Docker sandbox image.",
    );
  }

  const code = typeof body.code === "string" ? body.code : "";
  const stdin = typeof body.stdin === "string" ? body.stdin : "";
  const memoryChecks = Boolean(body.options?.memoryChecks);

  const codeBytes = Buffer.byteLength(code, "utf8");
  const stdinBytes = Buffer.byteLength(stdin, "utf8");
  if (!code.trim()) {
    throw new RunValidationError(400, "Code is required.");
  }
  if (codeBytes > limits.maxCodeBytes) {
    throw new RunValidationError(
      413,
      `Code exceeds limit of ${limits.maxCodeBytes} bytes.`,
    );
  }
  if (stdinBytes > limits.maxStdinBytes) {
    throw new RunValidationError(
      413,
      `stdin exceeds limit of ${limits.maxStdinBytes} bytes.`,
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "cpp-run-"));
  try {
    await writeFile(path.join(workDir, "main.cpp"), code, "utf8");

    const compileSpawn = await runSandboxed(caps.mode, workDir, gppArgv(memoryChecks), {
      timeoutMs: limits.compileTimeoutMs,
      maxOutputBytes: limits.maxOutputBytes,
    });

    const compileStderr = redactPaths(compileSpawn.stderr, workDir);
    const compileStdout = redactPaths(compileSpawn.stdout, workDir);
    const diagnostics = parseGppDiagnostics(compileStderr);

    const compile: CompileResult = {
      ok:
        !compileSpawn.timedOut &&
        compileSpawn.exitCode === 0 &&
        diagnostics.every((d) => d.severity !== "error"),
      stdout: truncateOutput(compileStdout, limits.maxOutputBytes).text,
      stderr: truncateOutput(compileStderr, limits.maxOutputBytes).text,
      diagnostics,
      durationMs: compileSpawn.durationMs,
      timedOut: compileSpawn.timedOut,
    };

    // If g++ itself failed to start (exit null), surface clearly
    if (compileSpawn.exitCode === null && !compileSpawn.timedOut) {
      compile.ok = false;
      compile.stderr =
        compile.stderr ||
        "Compiler failed to start. Is g++ installed inside the sandbox?";
    }

    if (!compile.ok) {
      return {
        compile,
        run: null,
        sandbox: { mode: caps.mode, memoryChecks },
      };
    }

    const runSpawn = await runSandboxed(
      caps.mode,
      workDir,
      ["./main"],
      {
        stdin,
        timeoutMs: limits.runTimeoutMs,
        maxOutputBytes: limits.maxOutputBytes,
      },
    );

    const outTrunc = truncateOutput(
      redactPaths(runSpawn.stdout, workDir),
      limits.maxOutputBytes,
    );
    const errTrunc = truncateOutput(
      redactPaths(runSpawn.stderr, workDir),
      limits.maxOutputBytes,
    );

    const run: RunResult = {
      ok: !runSpawn.timedOut && runSpawn.exitCode === 0,
      stdout: outTrunc.text,
      stderr: errTrunc.text,
      exitCode: runSpawn.exitCode,
      signal: runSpawn.signal,
      timedOut: runSpawn.timedOut,
      durationMs: runSpawn.durationMs,
      truncated: outTrunc.truncated || errTrunc.truncated || runSpawn.truncated,
    };

    return {
      compile,
      run,
      sandbox: { mode: caps.mode, memoryChecks },
    };
  } finally {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  }
}
