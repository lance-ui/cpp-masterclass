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

export interface RunApiResponse {
  compile: CompileResult;
  run: RunResult | null;
  sandbox: {
    mode: "docker" | "bwrap" | "none";
    memoryChecks: boolean;
  };
}

export interface RunApiError {
  error: string;
  status: number;
}

export async function runCppOnServer(
  input: {
    code: string;
    stdin?: string;
    memoryChecks?: boolean;
  },
  opts?: { signal?: AbortSignal },
): Promise<RunApiResponse> {
  const res = await fetch("/api/run", {
    method: "POST",
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      code: input.code,
      stdin: input.stdin ?? "",
      options: { memoryChecks: Boolean(input.memoryChecks) },
    }),
    signal: opts?.signal,
  });

  const data: unknown = await res.json().catch(() => ({}));
  if (!res.ok) {
    const err = data as { error?: string };
    const error: RunApiError = {
      status: res.status,
      error:
        err.error ||
        (res.status === 401
          ? "Sign in required to run code."
          : res.status === 429
            ? "Too many runs — wait a moment and try again."
            : res.status === 503
              ? "Sandbox unavailable. Ask the host to enable Docker or bubblewrap."
              : "Could not reach the compiler."),
    };
    throw error;
  }
  return data as RunApiResponse;
}

export async function fetchRunStatus(): Promise<{
  ready: boolean;
  sandbox: { mode: string; message: string };
} | null> {
  try {
    const res = await fetch("/api/run/status", { credentials: "include" });
    if (!res.ok) return null;
    return (await res.json()) as {
      ready: boolean;
      sandbox: { mode: string; message: string };
    };
  } catch {
    return null;
  }
}

export function signalLabel(signal: string | null): string | null {
  if (!signal) return null;
  const map: Record<string, string> = {
    SIGSEGV: "Segmentation fault (SIGSEGV)",
    SIGABRT: "Aborted (SIGABRT)",
    SIGFPE: "Floating-point exception (SIGFPE)",
    SIGILL: "Illegal instruction (SIGILL)",
    SIGBUS: "Bus error (SIGBUS)",
    SIGKILL: "Killed (SIGKILL)",
  };
  return map[signal] || `Terminated (${signal})`;
}
