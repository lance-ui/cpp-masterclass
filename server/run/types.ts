export type DiagnosticSeverity = "error" | "warning" | "note";

export interface CompileDiagnostic {
  line: number;
  col: number;
  severity: DiagnosticSeverity;
  message: string;
  raw: string;
}

export interface CompileResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  diagnostics: CompileDiagnostic[];
  durationMs: number;
  timedOut: boolean;
}

export interface RunResult {
  ok: boolean;
  stdout: string;
  stderr: string;
  exitCode: number | null;
  signal: string | null;
  timedOut: boolean;
  durationMs: number;
  truncated: boolean;
}

export interface RunRequestBody {
  code: string;
  stdin?: string;
  options?: {
    memoryChecks?: boolean;
  };
}

export interface RunResponse {
  compile: CompileResult;
  run: RunResult | null;
  sandbox: {
    mode: SandboxMode;
    memoryChecks: boolean;
  };
}

export type SandboxMode = "docker" | "bwrap" | "none";

export interface SandboxCapabilities {
  mode: SandboxMode;
  gppAvailable: boolean;
  dockerAvailable: boolean;
  bwrapAvailable: boolean;
  allowUnsafeLocal: boolean;
  message: string;
}

export interface ExecuteLimits {
  maxCodeBytes: number;
  maxStdinBytes: number;
  compileTimeoutMs: number;
  runTimeoutMs: number;
  maxOutputBytes: number;
  maxConcurrentRuns: number;
  rateLimitPerMinute: number;
  memoryMb: number;
  cpus: number;
  pidsLimit: number;
  /** Wall-clock for interactive WS sessions (default 30s). */
  interactiveTimeoutMs: number;
  /** Idle wait for stdin during interactive run (default 60s). */
  interactiveIdleTimeoutMs: number;
  /** Max bytes per interactive stdin message. */
  interactiveStdinChunkBytes: number;
  /** Max total stdin across an interactive session. */
  interactiveStdinTotalBytes: number;
}
