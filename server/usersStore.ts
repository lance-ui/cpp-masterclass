import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

export type UserRole = "student" | "admin";
export type AuthProvider = "local" | "google";

export interface UserProgress {
  bookmarkedModuleIds: string[];
  completedModuleIds: string[];
  quizScores: Record<string, number>;
  recentModuleIds: string[];
  notes: Record<string, string>;
}

export interface StoredUser extends UserProgress {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  passwordHash?: string;
  googleId?: string;
  avatarUrl?: string;
  createdAt: string;
}

export interface PublicUser extends UserProgress {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  avatarUrl?: string;
}

const EMPTY_PROGRESS: UserProgress = {
  bookmarkedModuleIds: [],
  completedModuleIds: [],
  quizScores: {},
  recentModuleIds: [],
  notes: {},
};

const __dirname = path.dirname(fileURLToPath(import.meta.url));
export const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, "[]", "utf8");
  }
}

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

function normalizeProgress(raw: Partial<UserProgress> | undefined): UserProgress {
  return {
    bookmarkedModuleIds: isStringArray(raw?.bookmarkedModuleIds)
      ? [...new Set(raw.bookmarkedModuleIds)]
      : [],
    completedModuleIds: isStringArray(raw?.completedModuleIds)
      ? [...new Set(raw.completedModuleIds)]
      : [],
    quizScores: isNumberRecord(raw?.quizScores) ? { ...raw.quizScores } : {},
    recentModuleIds: isStringArray(raw?.recentModuleIds)
      ? raw.recentModuleIds.slice(0, 8)
      : [],
    notes: isStringRecord(raw?.notes) ? { ...raw.notes } : {},
  };
}

function withProgressDefaults(user: StoredUser): StoredUser {
  const progress = normalizeProgress(user);
  return { ...user, ...progress };
}

function readUsers(): StoredUser[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(usersPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    if (!Array.isArray(parsed)) return [];
    return (parsed as StoredUser[]).map(withProgressDefaults);
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureStore();
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
}

export function toPublicUser(user: StoredUser): PublicUser {
  const progress = normalizeProgress(user);
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
    ...progress,
  };
}

export function emptyProgress(): UserProgress {
  return { ...EMPTY_PROGRESS, quizScores: {}, notes: {} };
}

export function findByEmail(email: string): StoredUser | undefined {
  const normalized = email.trim().toLowerCase();
  return readUsers().find((u) => u.email.toLowerCase() === normalized);
}

export function findById(id: string): StoredUser | undefined {
  return readUsers().find((u) => u.id === id);
}

export function findByGoogleId(googleId: string): StoredUser | undefined {
  return readUsers().find((u) => u.googleId === googleId);
}

export async function createLocalUser(input: {
  name: string;
  email: string;
  password: string;
  role?: UserRole;
}): Promise<{ user: PublicUser; error?: string }> {
  const email = input.email.trim().toLowerCase();
  if (findByEmail(email)) {
    return {
      user: toPublicUser(findByEmail(email)!),
      error: "Account already exists — signed you in.",
    };
  }
  const passwordHash = await bcrypt.hash(input.password, 10);
  const user: StoredUser = {
    id: `user-${Date.now()}`,
    name: input.name.trim(),
    email,
    role: input.role ?? "student",
    authProvider: "local",
    passwordHash,
    createdAt: new Date().toISOString(),
    ...emptyProgress(),
  };
  const users = readUsers();
  users.push(user);
  writeUsers(users);
  return { user: toPublicUser(user) };
}

export async function verifyLocalLogin(
  email: string,
  password: string,
): Promise<{ user?: PublicUser; error?: string }> {
  const found = findByEmail(email);
  if (!found) {
    // Auto-provision for first-time email login (matches prior UX)
    if (
      !password ||
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      return { error: "Incorrect email or password." };
    }
    const created = await createLocalUser({
      name: email.split("@")[0] || "Learner",
      email,
      password,
    });
    return { user: created.user };
  }
  if (found.authProvider === "google" && !found.passwordHash) {
    return {
      error: "This email uses Google sign-in. Continue with Google instead.",
    };
  }
  if (!found.passwordHash) {
    return { error: "Invalid email or password." };
  }
  const ok = await bcrypt.compare(password, found.passwordHash);
  if (!ok) return { error: "Invalid email or password." };
  return { user: toPublicUser(found) };
}

export function upsertGoogleUser(profile: {
  googleId: string;
  email: string;
  name: string;
  avatarUrl?: string;
}): PublicUser {
  const email = profile.email.trim().toLowerCase();
  const users = readUsers();
  const byGoogle = users.find((u) => u.googleId === profile.googleId);
  const byEmail = users.find((u) => u.email.toLowerCase() === email);

  if (byGoogle) {
    byGoogle.name = profile.name || byGoogle.name;
    byGoogle.avatarUrl = profile.avatarUrl || byGoogle.avatarUrl;
    byGoogle.email = email;
    writeUsers(users);
    return toPublicUser(withProgressDefaults(byGoogle));
  }

  if (byEmail) {
    byEmail.googleId = profile.googleId;
    byEmail.avatarUrl = profile.avatarUrl || byEmail.avatarUrl;
    byEmail.name = profile.name || byEmail.name;
    if (byEmail.authProvider === "local") {
      // Linked account — keep local password, mark dual
      byEmail.authProvider = "google";
    }
    writeUsers(users);
    return toPublicUser(withProgressDefaults(byEmail));
  }

  const user: StoredUser = {
    id: `user-${Date.now()}`,
    name: profile.name || email.split("@")[0] || "Learner",
    email,
    role: "student",
    authProvider: "google",
    googleId: profile.googleId,
    avatarUrl: profile.avatarUrl,
    createdAt: new Date().toISOString(),
    ...emptyProgress(),
  };
  users.push(user);
  writeUsers(users);
  return toPublicUser(user);
}

export function listPublicUsers(): PublicUser[] {
  return readUsers().map(toPublicUser);
}

export function updateRole(
  userId: string,
  role: UserRole,
): PublicUser | undefined {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  user.role = role;
  writeUsers(users);
  return toPublicUser(withProgressDefaults(user));
}

export function updateUserProgress(
  userId: string,
  progress: Partial<UserProgress>,
): PublicUser | undefined {
  const users = readUsers();
  const user = users.find((u) => u.id === userId);
  if (!user) return undefined;
  const next = normalizeProgress({
    bookmarkedModuleIds:
      progress.bookmarkedModuleIds ?? user.bookmarkedModuleIds,
    completedModuleIds:
      progress.completedModuleIds ?? user.completedModuleIds,
    quizScores: progress.quizScores ?? user.quizScores,
    recentModuleIds: progress.recentModuleIds ?? user.recentModuleIds,
    notes: progress.notes ?? user.notes,
  });
  Object.assign(user, next);
  writeUsers(users);
  return toPublicUser(user);
}

/** True when the account has no learning progress yet (migration candidate). */
export function isProgressEmpty(progress: UserProgress): boolean {
  return (
    progress.completedModuleIds.length === 0 &&
    progress.bookmarkedModuleIds.length === 0 &&
    progress.recentModuleIds.length === 0 &&
    Object.keys(progress.quizScores).length === 0 &&
    Object.keys(progress.notes).length === 0
  );
}

export function parseProgressBody(body: unknown): UserProgress | null {
  if (typeof body !== "object" || body === null || Array.isArray(body)) {
    return null;
  }
  const raw = body as Record<string, unknown>;
  if (
    raw.bookmarkedModuleIds !== undefined &&
    !isStringArray(raw.bookmarkedModuleIds)
  ) {
    return null;
  }
  if (
    raw.completedModuleIds !== undefined &&
    !isStringArray(raw.completedModuleIds)
  ) {
    return null;
  }
  if (raw.recentModuleIds !== undefined && !isStringArray(raw.recentModuleIds)) {
    return null;
  }
  if (raw.quizScores !== undefined && !isNumberRecord(raw.quizScores)) {
    return null;
  }
  if (raw.notes !== undefined && !isStringRecord(raw.notes)) {
    return null;
  }
  return normalizeProgress(raw as Partial<UserProgress>);
}

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}
