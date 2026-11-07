import type { User, UserRole } from "@/types";

export interface SessionUser {
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
    return data.user;
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
  return { success: true as const, user: data.user };
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
  return { success: true as const, user: data.user, notice: data.notice };
}

export async function apiLogout() {
  try {
    await apiFetch("/api/auth/logout", { method: "POST" });
  } catch {
    // ignore network errors on logout
  }
}

export function googleSignInUrl() {
  return "/api/auth/google";
}

/** Merge session identity with locally persisted progress for that account. */
export function hydrateUserFromSession(
  session: SessionUser,
  localUsers: User[],
): User {
  const existing =
    localUsers.find((u) => u.id === session.id) ||
    localUsers.find(
      (u) => u.email.toLowerCase() === session.email.toLowerCase(),
    );

  return {
    id: session.id,
    name: session.name,
    email: session.email,
    role: session.role,
    avatarUrl: session.avatarUrl,
    authProvider: session.authProvider,
    bookmarkedModuleIds: existing?.bookmarkedModuleIds ?? [],
    completedModuleIds: existing?.completedModuleIds ?? [],
    quizScores: existing?.quizScores ?? {},
    recentModuleIds: existing?.recentModuleIds ?? [],
    notes: existing?.notes ?? {},
  };
}
