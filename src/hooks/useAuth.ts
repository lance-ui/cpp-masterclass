import { useCallback, useEffect, useRef, useState } from "react";
import type { User, UserRole } from "@/types";
import { readStoredValue, writeStoredValue } from "@/utils/storage";
import {
  apiLogin,
  apiLogout,
  apiSaveProgress,
  apiSignup,
  fetchAdminUsers,
  fetchAuthConfig,
  fetchSessionUser,
  hydrateUserFromSession,
  isProgressEmpty,
  progressFromUser,
  progressKey,
  type AuthConfig,
  type SessionUser,
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
    copy[byEmail] = { ...copy[byEmail], ...next };
    return copy;
  }
  return [...users, next];
}

function readLocalUsers(): User[] {
  return readStoredValue(
    "users",
    [] as User[],
    isUserArray,
    "cpp_masterclass_all_users",
  ).filter((u) => !LEGACY_DEMO_IDS.has(u.id));
}

function applySessionUser(
  session: SessionUser,
  locals: User[],
): { user: User; needsMigrate: boolean } {
  const hydrated = hydrateUserFromSession(session, locals);
  const needsMigrate =
    isProgressEmpty(session) && !isProgressEmpty(progressFromUser(hydrated));
  return { user: hydrated, needsMigrate };
}

export function useAuth() {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [authReady, setAuthReady] = useState(false);
  const [authConfig, setAuthConfig] = useState<AuthConfig>({
    googleEnabled: false,
    appUrl: typeof window !== "undefined" ? window.location.origin : "",
  });
  const [allUsers, setAllUsers] = useState<User[]>(() => readLocalUsers());

  const lastSyncedProgressKey = useRef<string | null>(null);
  const progressSyncTimer = useRef<number | null>(null);

  useEffect(() => {
    writeStoredValue("users", allUsers);
  }, [allUsers]);

  useEffect(() => {
    if (!currentUser) return;
    setAllUsers((prev) => upsertLocalUser(prev, currentUser));
  }, [currentUser]);

  // Debounced persist of learning progress to the server account.
  useEffect(() => {
    if (!currentUser || !authReady) return;
    const payload = progressFromUser(currentUser);
    const key = progressKey(payload);
    if (key === lastSyncedProgressKey.current) return;

    if (progressSyncTimer.current) {
      window.clearTimeout(progressSyncTimer.current);
    }

    progressSyncTimer.current = window.setTimeout(() => {
      void (async () => {
        const saved = await apiSaveProgress(payload);
        if (!saved) return;
        lastSyncedProgressKey.current = key;
      })();
    }, 450);

    return () => {
      if (progressSyncTimer.current) {
        window.clearTimeout(progressSyncTimer.current);
      }
    };
  }, [currentUser, authReady]);

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
        const { user, needsMigrate } = applySessionUser(
          session,
          readLocalUsers(),
        );
        lastSyncedProgressKey.current = needsMigrate
          ? null
          : progressKey(progressFromUser(user));
        setCurrentUser(user);

        if (user.role === "admin") {
          const remoteUsers = await fetchAdminUsers();
          if (!cancelled && remoteUsers.length > 0) {
            setAllUsers(remoteUsers);
          }
        }
      } else {
        setCurrentUser(null);
        lastSyncedProgressKey.current = null;
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
      const { user, needsMigrate } = applySessionUser(
        res.user,
        readLocalUsers(),
      );
      lastSyncedProgressKey.current = needsMigrate
        ? null
        : progressKey(progressFromUser(user));
      setCurrentUser(user);
      setAllUsers((prev) => upsertLocalUser(prev, user));
      if (user.role === "admin") {
        const remoteUsers = await fetchAdminUsers();
        if (remoteUsers.length > 0) setAllUsers(remoteUsers);
      }
      return { success: true };
    } catch {
      return {
        success: false,
        error: "Could not reach the auth server. Is it running?",
      };
    }
  }, []);

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
        const { user, needsMigrate } = applySessionUser(
          res.user,
          readLocalUsers(),
        );
        lastSyncedProgressKey.current = needsMigrate
          ? null
          : progressKey(progressFromUser(user));
        setCurrentUser(user);
        setAllUsers((prev) => upsertLocalUser(prev, user));
        return { success: true };
      } catch {
        return {
          success: false,
          error: "Could not reach the auth server. Is it running?",
        };
      }
    },
    [],
  );

  const logout = useCallback(async () => {
    if (progressSyncTimer.current) {
      window.clearTimeout(progressSyncTimer.current);
      progressSyncTimer.current = null;
    }
    if (currentUser) {
      await apiSaveProgress(progressFromUser(currentUser));
    }
    await apiLogout();
    setCurrentUser(null);
    lastSyncedProgressKey.current = null;
  }, [currentUser]);

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
