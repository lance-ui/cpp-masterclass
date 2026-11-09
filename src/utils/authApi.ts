import type { User, UserRole } from "@/types";

export interface UserProgressPayload {
  bookmarkedModuleIds: string[];
  completedModuleIds: string[];
  quizScores: Record<string, number>;
  recentModuleIds: string[];
  notes: Record<string, string>;
}

export interface SessionUser extends UserProgressPayload {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: "local" | "google";
  avatarUrl?: string;
}

export interface AuthConfig {
  googleEnabled: boolean;
  appUrl: string;
}

const EMPTY_PROGRESS: UserProgressPayload = {
  bookmarkedModuleIds: [],
  completedModuleIds: [],
  quizScores: {},
  recentModuleIds: [],
  notes: {},
};

function isStringArray(value: unknown): value is string[] {
  return Array.isArray(value) && value.every((item) => typeof item === "string");
}

function isNumberRecord(value: unknown): value is Record<string, number> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "number")
  );
}

function isStringRecord(value: unknown): value is Record<string, string> {
  return (
    typeof value === "object" &&
    value !== null &&
    !Array.isArray(value) &&
    Object.values(value).every((item) => typeof item === "string")
  );
}

function normalizeProgress(
  raw: Partial<UserProgressPayload> | undefined,
): UserProgressPayload {
  return {
    bookmarkedModuleIds: isStringArray(raw?.bookmarkedModuleIds)
      ? [...raw.bookmarkedModuleIds]
      : [],
    completedModuleIds: isStringArray(raw?.completedModuleIds)
      ? [...raw.completedModuleIds]
      : [],
    quizScores: isNumberRecord(raw?.quizScores) ? { ...raw.quizScores } : {},
    recentModuleIds: isStringArray(raw?.recentModuleIds)
      ? raw.recentModuleIds.slice(0, 8)
      : [],
    notes: isStringRecord(raw?.notes) ? { ...raw.notes } : {},
  };
}

export function isProgressEmpty(progress: UserProgressPayload): boolean {
  return (
    progress.completedModuleIds.length === 0 &&
    progress.bookmarkedModuleIds.length === 0 &&
    progress.recentModuleIds.length === 0 &&
    Object.keys(progress.quizScores).length === 0 &&
    Object.keys(progress.notes).length === 0
  );
}

export function progressFromUser(user: User): UserProgressPayload {
  return {
    bookmarkedModuleIds: [...user.bookmarkedModuleIds],
    completedModuleIds: [...user.completedModuleIds],
    quizScores: { ...user.quizScores },
    recentModuleIds: [...user.recentModuleIds],
    notes: { ...user.notes },
  };
}

export function progressKey(progress: UserProgressPayload): string {
  return JSON.stringify({
    bookmarkedModuleIds: progress.bookmarkedModuleIds,
    completedModuleIds: progress.completedModuleIds,
    quizScores: progress.quizScores,
    recentModuleIds: progress.recentModuleIds,
    notes: progress.notes,
  });
}

async function parseJson<T>(res: Response): Promise<T> {
  const contentType = res.headers.get("content-type") || "";
  if (!contentType.includes("application/json")) {
    throw new Error("Unexpected server response.");
  }
  return (await res.json()) as T;
}

async function apiFetch(input: string, init?: RequestInit) {
  const controller = new AbortController();
  const timer = window.setTimeout(() => controller.abort(), 5000);
  try {
    return await fetch(input, {
      ...init,
      credentials: "include",
      signal: controller.signal,
    });
  } finally {
    window.clearTimeout(timer);
  }
}

export async function fetchAuthConfig(): Promise<AuthConfig> {
  try {
    const res = await apiFetch("/api/auth/config");
    if (!res.ok) return { googleEnabled: false, appUrl: window.location.origin };
    return parseJson<AuthConfig>(res);
  } catch {
    return { googleEnabled: false, appUrl: window.location.origin };
  }
}

export async function fetchSessionUser(): Promise<SessionUser | null> {
  try {
    const res = await apiFetch("/api/auth/me");
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await parseJson<{ user: SessionUser | null }>(res);
    if (!data.user) return null;
    return {
      ...data.user,
      ...normalizeProgress(data.user),
    };
  } catch {
    return null;
  }
}

export async function apiLogin(email: string, password?: string) {
  const res = await apiFetch("/api/auth/login", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ email, password: password || "" }),
  });
  const data = await parseJson<{ user?: SessionUser; error?: string }>(res);
  if (!res.ok || !data.user) {
    return { success: false as const, error: data.error || "Sign-in failed." };
  }
  return {
    success: true as const,
    user: { ...data.user, ...normalizeProgress(data.user) },
  };
}

export async function apiSignup(
  name: string,
  email: string,
  password?: string,
) {
  const res = await apiFetch("/api/auth/signup", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, email, password: password || "" }),
  });
  const data = await parseJson<{
    user?: SessionUser;
    error?: string;
    notice?: string;
  }>(res);
  if (!res.ok || !data.user) {
    return {
      success: false as const,
      error: data.error || "Could not create account.",
    };
  }
  return {
    success: true as const,
    user: { ...data.user, ...normalizeProgress(data.user) },
    notice: data.notice,
  };
}

export async function apiLogout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore network errors on logout
  }
}

export async function apiSaveProgress(
  progress: UserProgressPayload,
): Promise<SessionUser | null> {
  try {
    const res = await apiFetch("/api/me/progress", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(normalizeProgress(progress)),
    });
    if (res.status === 401) return null;
    if (!res.ok) return null;
    const data = await parseJson<{ user?: SessionUser }>(res);
    if (!data.user) return null;
    return { ...data.user, ...normalizeProgress(data.user) };
  } catch {
    return null;
  }
}

export async function fetchAdminUsers(): Promise<User[]> {
  try {
    const res = await apiFetch("/api/admin/users");
    if (!res.ok) return [];
    const data = await parseJson<{ users?: SessionUser[] }>(res);
    if (!Array.isArray(data.users)) return [];
    return data.users.map((session) => hydrateUserFromSession(session, []));
  } catch {
    return [];
  }
}

export function googleSignInUrl() {
  return "/api/auth/google";
}

/**
 * Build a client User from the server session.
 * If the server has no progress yet, prefer any matching local cache (one-time migration).
 */
export function hydrateUserFromSession(
  session: SessionUser,
  localUsers: User[],
): User {
  const serverProgress = normalizeProgress(session);
  const existing =
    localUsers.find((u) => u.id === session.id) ||
    localUsers.find(
      (u) => u.email.toLowerCase() === session.email.toLowerCase(),
    );

  const localProgress = existing
    ? progressFromUser(existing)
    : { ...EMPTY_PROGRESS, quizScores: {}, notes: {} };

  const progress =
    isProgressEmpty(serverProgress) && !isProgressEmpty(localProgress)
      ? localProgress
      : serverProgress;

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    avatarUrl: session.avatarUrl,
    authProvider: session.authProvider,
    ...progress,
  };
}
