/**
 * Validate a post-login redirect target.
 * Only same-origin relative paths are allowed (no protocol-relative, no absolute URLs).
 */
const ALLOWED_PREFIXES = [
  "/lessons",
  "/sandbox",
  "/dashboard",
  "/admin",
  "/community",
  "/design",
  "/terms",
  "/privacy",
] as const;

export function safeNextPath(
  raw: string | null | undefined,
  fallback = "/lessons",
): string {
  if (!raw) return fallback;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return fallback;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return fallback;
  if (value.includes("://") || value.includes("\\")) return fallback;
  if (/[\s<>'"`]/.test(value)) return fallback;

  const pathOnly = value.split(/[?#]/)[0] || "/";
  const normalized = pathOnly.replace(/\/+$/, "") || "/";

  if (normalized === "/login" || normalized === "/signup" || normalized === "/") {
    return fallback;
  }

  const allowed = ALLOWED_PREFIXES.some(
    (prefix) => normalized === prefix || normalized.startsWith(`${prefix}/`),
  );
  if (!allowed) return fallback;

  return value.startsWith(normalized) ? value : normalized;
}

export function readNextFromSearch(search: string): string {
  try {
    const params = new URLSearchParams(search);
    return safeNextPath(params.get("next"));
  } catch {
    return "/lessons";
  }
}
