import type { CompileDiagnostic, DiagnosticSeverity } from "./types.js";

const DIAG_RE =
  /^(?:\.\/)?(?:main\.cpp|\.\/main\.cpp):(\d+):(?:(\d+):)?\s*(fatal error|error|warning|note):\s*(.+)$/i;

export function parseGppDiagnostics(stderr: string): CompileDiagnostic[] {
  const out: CompileDiagnostic[] = [];
  for (const line of stderr.split(/\r?\n/)) {
    const m = line.match(DIAG_RE);
    if (!m) continue;
    const severityRaw = (m[3] || "error").toLowerCase();
    let severity: DiagnosticSeverity = "error";
    if (severityRaw.includes("warning")) severity = "warning";
    else if (severityRaw.includes("note")) severity = "note";
    out.push({
      line: Number(m[1]) || 1,
      col: Number(m[2]) || 1,
      severity,
      message: (m[4] || "").trim(),
      raw: line,
    });
  }
  return out;
}
