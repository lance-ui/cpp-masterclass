import { useCallback, useEffect, useState } from "react";
import type { User, UserRole } from "@/types";
import { readStoredValue, writeStoredValue } from "@/utils/storage";
import {
  apiLogin,
  apiLogout,
  apiSignup,
  fetchAuthConfig,
  fetchSessionUser,
  hydrateUserFromSession,
  type AuthConfig,
} from "@/utils/authApi";

const LEGACY_DEMO_IDS = new Set([
  "student-1",
  "user-2",
  "user-3",
  "admin-1",
  "demo-student",
  "demo-admin",
]);

const isStringArray = (value: unknown): value is string[] =>
  Array.isArray(value) && value.every((item) => typeof item === "string");

const isRecord = (value: unknown): value is Record<string, unknown> =>
  typeof value === "object" && value !== null && !Array.isArray(value);

const isNumberRecord = (value: unknown): value is Record<string, number> =>
  isRecord(value) &&
  Object.values(value).every((item) => typeof item === "number");

const isStringRecord = (value: unknown): value is Record<string, string> =>
  isRecord(value) &&
  Object.values(value).every((item) => typeof item === "string");

function isUser(value: unknown): value is User {
  if (!isRecord(value)) return false;
  const user = value;
  return (
    typeof user.id === "string" &&
    typeof user.name === "string" &&
    typeof user.email === "string" &&
    (user.role === "student" || user.role === "admin") &&
    isStringArray(user.bookmarkedModuleIds) &&
    isStringArray(user.completedModuleIds) &&
    isNumberRecord(user.quizScores) &&
    isStringArray(user.recentModuleIds) &&
    isStringRecord(user.notes)
  );
}

const isUserArray = (value: unknown): value is User[] =>
  Array.isArray(value) && value.every(isUser);

function upsertLocalUser(users: User[], next: User): User[] {
  const byId = users.findIndex((u) => u.id === next.id);
  if (byId >= 0) {
    const copy = users.slice();
    copy[byId] = { ...copy[byId], ...next };
    return copy;
  }
  const byEmail = users.findIndex(
    (u) => u.email.toLowerCase() === next.email.toLowerCase(),
  );
  if (byEmail >= 0) {
    const copy = users.slice();
    copy[byEmail] = {
      ...copy[byEmail],
      ...next,
      bookmarkedModuleIds: copy[byEmail].bookmarkedModuleIds,
      completedModuleIds: copy[byEmail].completedModuleIds,
      quizScores: copy[byEmail].quizScores,
      recentModuleIds: copy[byEmail].recentModuleIds,
      notes: copy[byEmail].notes,
    };
    return copy;
  }
  return [...users, next];
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    googleEnabled: false,
    appUrl: typeof window !== "undefined" ? window.location.origin : "",
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => {
    const storedUsers = readStoredValue(
      "users",
      [] as User[],
      isUserArray,
      "cpp_masterclass_all_users",
    );
    return storedUsers.filter((u) => !LEGACY_DEMO_IDS.has(u.id));
  });

  useEffect(() => {
    writeStoredValue("users", allUsers);
  }, [allUsers]);

  useEffect(() => {
    if (!currentUser) return;
    setAllUsers((prev) => upsertLocalUser(prev, currentUser));
  }, [currentUser]);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const [config, session] = await Promise.all([
        fetchAuthConfig(),
        fetchSessionUser(),
      ]);
      if (cancelled) return;
      setAuthConfig(config);
      if (session) {
        setCurrentUser((prev) => {
          const locals = readStoredValue(
            "users",
            [] as User[],
            isUserArray,
            "cpp_masterclass_all_users",
          );
          const hydrated = hydrateUserFromSession(session, locals);
          if (prev && prev.id === hydrated.id) {
            return {
              ...hydrated,
              bookmarkedModuleIds: prev.bookmarkedModuleIds,
              completedModuleIds: prev.completedModuleIds,
              quizScores: prev.quizScores,
              recentModuleIds: prev.recentModuleIds,
              notes: prev.notes,
            };
          }
          return hydrated;
        });
      } else {
        setCurrentUser(null);
      }
      setAuthReady(true);
    })();
    return () => {
      cancelled = true;
    };
  }, []);

  const login = useCallback(async (email: string, password?: string) => {
    try {
      const res = await apiLogin(email, password);
      if (!res.success) return { success: false, error: res.error };
      const hydrated = hydrateUserFromSession(res.user, allUsers);
      setCurrentUser(hydrated);
      setAllUsers((prev) => upsertLocalUser(prev, hydrated));
      return { success: true };
    } catch {
      return {
        success: false,
        error: "Could not reach the auth server. Is it running?",
      };
    }
  }, [allUsers]);

  const signup = useCallback(
    async (
      name: string,
      email: string,
      _role: UserRole,
      password?: string,
    ) => {
      try {
        const res = await apiSignup(name, email, password);
        if (!res.success) return { success: false, error: res.error };
        const hydrated = hydrateUserFromSession(res.user, allUsers);
        setCurrentUser(hydrated);
        setAllUsers((prev) => upsertLocalUser(prev, hydrated));
        return { success: true };
      } catch {
        return {
          success: false,
          error: "Could not reach the auth server. Is it running?",
        };
      }
    },
    [allUsers],
  );

  const logout = useCallback(async () => {
    await apiLogout();
    setCurrentUser(null);
  }, []);

  const updateUserRole = useCallback((userId: string, newRole: UserRole) => {
    setAllUsers((users) =>
      users.map((user) =>
        user.id === userId ? { ...user, role: newRole } : user,
      ),
    );
    setCurrentUser((user) =>
      user && user.id === userId ? { ...user, role: newRole } : user,
    );
    void fetch(`/api/admin/users/${userId}/role`, {
      method: "PATCH",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    }).catch(() => undefined);
  }, []);

  return {
    currentUser,
    setCurrentUser,
    allUsers,
    login,
    signup,
    logout,
    updateUserRole,
    authReady,
    authConfig,
  };
}
