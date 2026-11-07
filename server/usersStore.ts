import fs from "node:fs";
import path from "node:path";
import bcrypt from "bcryptjs";
import { fileURLToPath } from "node:url";

export type UserRole = "student" | "admin";
export type AuthProvider = "local" | "google";

export interface StoredUser {
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

export interface PublicUser {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  authProvider: AuthProvider;
  avatarUrl?: string;
}

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dataDir = path.join(__dirname, "data");
const usersPath = path.join(dataDir, "users.json");

function ensureStore() {
  if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
  if (!fs.existsSync(usersPath)) {
    fs.writeFileSync(usersPath, "[]", "utf8");
  }
}

function readUsers(): StoredUser[] {
  ensureStore();
  try {
    const raw = fs.readFileSync(usersPath, "utf8");
    const parsed = JSON.parse(raw) as unknown;
    return Array.isArray(parsed) ? (parsed as StoredUser[]) : [];
  } catch {
    return [];
  }
}

function writeUsers(users: StoredUser[]) {
  ensureStore();
  fs.writeFileSync(usersPath, JSON.stringify(users, null, 2), "utf8");
}

export function toPublicUser(user: StoredUser): PublicUser {
  return {
    id: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
    authProvider: user.authProvider,
    avatarUrl: user.avatarUrl,
  };
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
    return toPublicUser(byGoogle);
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
    return toPublicUser(byEmail);
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
  return toPublicUser(user);
}

export function googleConfigured() {
  return Boolean(
    process.env.GOOGLE_CLIENT_ID?.trim() &&
      process.env.GOOGLE_CLIENT_SECRET?.trim(),
  );
}
