import { mkdtemp, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import path from "node:path";
import { parseGppDiagnostics } from "./diagnostics.js";
import { loadExecuteLimits, redactPaths, truncateOutput } from "./limits.js";
import { buildBwrapArgv } from "./sandbox/bwrap.js";
import { dockerRunArgv } from "./sandbox/docker.js";
import {
  RunValidationError,
  SandboxUnavailableError,
  getSandboxCapabilities,
} from "./execute.js";
import {
  spawnInteractive,
  wrapForLiveOutput,
  type InteractiveHandle,
} from "./spawnInteractive.js";
import { spawnLimited } from "./spawnLimited.js";
import type { CompileResult, SandboxMode } from "./types.js";

function gppArgv(memoryChecks: boolean): string[] {
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
  return [
    "/usr/bin/g++",
    "-std=c++20",
    "-O1",
    "-Wall",
    "-Wextra",
    "-o",
    "main",
    "main.cpp",
  ];
}

async function compileInSandbox(
  mode: SandboxMode,
  workDir: string,
  memoryChecks: boolean,
): Promise<CompileResult> {
  const limits = loadExecuteLimits();
  const compileInner = gppArgv(memoryChecks);
  let argv: string[];
  let cwd = workDir;
  let env: NodeJS.ProcessEnv | undefined;

  if (mode === "docker") {
    argv = dockerRunArgv(workDir, compileInner, limits);
  } else if (mode === "bwrap") {
    argv = await buildBwrapArgv(workDir, compileInner);
    env = { PATH: "/usr/bin:/bin", LANG: "C.UTF-8" };
  } else {
    argv = compileInner;
    env = { ...process.env, PATH: process.env.PATH || "/usr/bin:/bin" };
  }

  const compileSpawn = await spawnLimited({
    argv,
    cwd,
    env,
    timeoutMs: limits.compileTimeoutMs,
    maxOutputBytes: limits.maxOutputBytes,
    processGroup: true,
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

  if (compileSpawn.exitCode === null && !compileSpawn.timedOut) {
    compile.ok = false;
    compile.stderr =
      compile.stderr ||
      "Compiler failed to start. Is g++ installed inside the sandbox?";
  }

  return compile;
}

async function buildRunArgv(
  mode: SandboxMode,
  workDir: string,
): Promise<{ argv: string[]; cwd?: string; env?: NodeJS.ProcessEnv }> {
  const limits = loadExecuteLimits();
  const live = await wrapForLiveOutput(["./main"]);

  if (mode === "docker") {
    // -i keeps stdin attached for interactive sessions
    const base = dockerRunArgv(workDir, live, limits);
    // insert -i after "run"
    const runIdx = base.indexOf("run");
    if (runIdx >= 0) {
      base.splice(runIdx + 1, 0, "-i");
    }
    return { argv: base };
  }
  if (mode === "bwrap") {
    return {
      argv: await buildBwrapArgv(workDir, live),
      cwd: workDir,
      env: { PATH: "/usr/bin:/bin", LANG: "C.UTF-8", HOME: "/work", TMPDIR: "/tmp" },
    };
  }
  return {
    argv: live,
    cwd: workDir,
    env: { ...process.env, PATH: process.env.PATH || "/usr/bin:/bin" },
  };
}

export interface InteractiveSession {
  workDir: string;
  compile: CompileResult;
  sandboxMode: SandboxMode;
  memoryChecks: boolean;
  process: InteractiveHandle | null;
  cleanup: () => Promise<void>;
  redact: (text: string) => string;
}

/**
 * Compile once, then (if ok) spawn an interactive sandboxed process.
 * Caller owns cleanup (always call cleanup()).
 */
export async function prepareInteractiveSession(input: {
  code: string;
  memoryChecks?: boolean;
}): Promise<InteractiveSession> {
  const limits = loadExecuteLimits();
  const caps = await getSandboxCapabilities();

  if (caps.mode === "none" && !caps.allowUnsafeLocal) {
    throw new SandboxUnavailableError(
      caps.message ||
        "Code execution sandbox is not available. See README for Docker/bwrap setup.",
    );
  }
  if (caps.mode !== "docker" && !caps.gppAvailable) {
    throw new SandboxUnavailableError(
      "g++ is not installed. Install gcc-c++ / g++, or build the Docker sandbox image.",
    );
  }

  const code = typeof input.code === "string" ? input.code : "";
  const memoryChecks = Boolean(input.memoryChecks);
  const codeBytes = Buffer.byteLength(code, "utf8");
  if (!code.trim()) {
    throw new RunValidationError(400, "Code is required.");
  }
  if (codeBytes > limits.maxCodeBytes) {
    throw new RunValidationError(
      413,
      `Code exceeds limit of ${limits.maxCodeBytes} bytes.`,
    );
  }

  const workDir = await mkdtemp(path.join(tmpdir(), "cpp-run-"));
  const cleanup = async () => {
    await rm(workDir, { recursive: true, force: true }).catch(() => undefined);
  };

  try {
    await writeFile(path.join(workDir, "main.cpp"), code, "utf8");
    const compile = await compileInSandbox(caps.mode, workDir, memoryChecks);

    if (!compile.ok) {
      return {
        workDir,
        compile,
        sandboxMode: caps.mode,
        memoryChecks,
        process: null,
        cleanup,
        redact: (t) => redactPaths(t, workDir),
      };
    }

    const runSpec = await buildRunArgv(caps.mode, workDir);
    const proc = spawnInteractive({
      argv: runSpec.argv,
      cwd: runSpec.cwd,
      env: runSpec.env,
      timeoutMs: limits.interactiveTimeoutMs,
      idleTimeoutMs: limits.interactiveIdleTimeoutMs,
      maxOutputBytes: limits.maxOutputBytes,
      processGroup: true,
    });

    return {
      workDir,
      compile,
      sandboxMode: caps.mode,
      memoryChecks,
      process: proc,
      cleanup,
      redact: (t) => redactPaths(t, workDir),
    };
  } catch (err) {
    await cleanup();
    throw err;
  }
}
