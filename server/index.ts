import "dotenv/config";
import http from "node:http";
import express from "express";
import session from "express-session";
import cookieParser from "cookie-parser";
import cors from "cors";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { OAuth2Client } from "google-auth-library";
import {
  createLocalUser,
  dataDir,
  findById,
  googleConfigured,
  listPublicUsers,
  parseProgressBody,
  toPublicUser,
  updateRole,
  updateUserProgress,
  upsertGoogleUser,
  verifyLocalLogin,
  type PublicUser,
} from "./usersStore.js";
import { FileSessionStore } from "./sessionStore.js";
import { createRunControllers, registerRunRoutes } from "./run/routes.js";
import { attachRunWebSocket } from "./run/wsRun.js";
import { getSandboxCapabilities } from "./run/execute.js";
import {
  GOOGLE_OAUTH_CALLBACK_PATH,
  googleOAuthRedirectUri,
  normalizeAppUrl,
} from "./oauthRedirect.js";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PORT = Number(process.env.PORT || 8787);
/** Bind address — production/containers must use 0.0.0.0 so platform health checks can reach the process. */
const HOST =
  process.env.HOST ||
  (process.env.NODE_ENV === "production" ? "0.0.0.0" : "127.0.0.1");
/** Public site origin — OAuth redirect_uri is always `${APP_URL}${GOOGLE_OAUTH_CALLBACK_PATH}`. */
const APP_URL = normalizeAppUrl(process.env.APP_URL);
const GOOGLE_REDIRECT_URI = googleOAuthRedirectUri(APP_URL);
const SESSION_SECRET =
  process.env.SESSION_SECRET ||
  process.env.AUTH_SECRET ||
  "dev-only-change-me-cpp-masterclass";

if (!process.env.SESSION_SECRET && !process.env.AUTH_SECRET) {
  console.warn(
    "[auth] SESSION_SECRET / AUTH_SECRET not set — using an insecure dev default.",
  );
}

if (!googleConfigured()) {
  console.warn(
    "[auth] GOOGLE_CLIENT_ID / GOOGLE_CLIENT_SECRET missing — Google sign-in disabled.",
  );
}

declare module "express-session" {
  interface SessionData {
    userId?: string;
    oauthState?: string;
    oauthNext?: string;
  }
}

/** Same-origin relative path only — mirrors client safeNextPath. */
function safeOAuthNext(raw: unknown): string | undefined {
  if (typeof raw !== "string") return undefined;
  let value = raw.trim();
  try {
    value = decodeURIComponent(value);
  } catch {
    return undefined;
  }
  if (!value.startsWith("/") || value.startsWith("//")) return undefined;
  if (value.includes("://") || value.includes("\\")) return undefined;
  const pathOnly = value.split(/[?#]/)[0] || "/";
  const normalized = pathOnly.replace(/\/+$/, "") || "/";
  const allowed = [
    "/lessons",
    "/sandbox",
    "/dashboard",
    "/admin",
    "/community",
    "/design",
    "/terms",
    "/privacy",
  ];
  if (!allowed.some((p) => normalized === p || normalized.startsWith(`${p}/`))) {
    return undefined;
  }
  return value;
}

const app = express();
app.set("trust proxy", 1);
app.use(
  cors({
    origin: APP_URL,
    credentials: true,
  }),
);
app.use(express.json({ limit: "120kb" }));
app.use(cookieParser());
const sessionMiddleware = session({
  name: "cpp_mc_sid",
  secret: SESSION_SECRET,
  resave: false,
  saveUninitialized: false,
  store: new FileSessionStore(path.join(dataDir, "sessions")),
  cookie: {
    httpOnly: true,
    secure: APP_URL.startsWith("https"),
    sameSite: "lax",
    maxAge: 1000 * 60 * 60 * 24 * 30,
  },
});
app.use(sessionMiddleware);

function sessionUser(req: express.Request): PublicUser | null {
  if (!req.session.userId) return null;
  const stored = findById(req.session.userId);
  return stored ? toPublicUser(stored) : null;
}

app.get("/api/auth/config", (_req, res) => {
  res.json({
    googleEnabled: googleConfigured(),
    appUrl: APP_URL,
  });
});

app.get("/api/auth/me", (req, res) => {
  const user = sessionUser(req);
  if (!user) {
    res.status(401).json({ user: null });
    return;
  }
  res.json({ user });
});

app.post("/api/auth/login", async (req, res) => {
  try {
    const email = String(req.body?.email || "");
    const password = String(req.body?.password || "");
    if (!email.trim()) {
      res.status(400).json({ error: "Email is required." });
      return;
    }
    const result = await verifyLocalLogin(email, password);
    if (!result.user) {
      res.status(401).json({ error: result.error || "Sign-in failed." });
      return;
    }
    req.session.userId = result.user.id;
    res.json({ user: result.user });
  } catch (error) {
    console.error("[auth/login]", error);
    res.status(500).json({ error: "Could not sign in. Try again." });
  }
});

app.post("/api/auth/signup", async (req, res) => {
  try {
    const name = String(req.body?.name || "");
    const email = String(req.body?.email || "");
    const password = String(req.body?.password || "");
    if (!name.trim() || !email.trim()) {
      res.status(400).json({ error: "Name and email are required." });
      return;
    }
    if (
      !password ||
      password.length < 8 ||
      !/[A-Za-z]/.test(password) ||
      !/\d/.test(password)
    ) {
      res.status(400).json({
        error:
          "Password needs at least 8 characters, including a letter and a number.",
      });
      return;
    }
    const result = await createLocalUser({
      name,
      email,
      password,
    });
    req.session.userId = result.user.id;
    res.json({ user: result.user, notice: result.error });
  } catch (error) {
    console.error("[auth/signup]", error);
    res.status(500).json({ error: "Could not create account." });
  }
});

app.post("/api/auth/logout", (req, res) => {
  req.session.destroy(() => {
    res.clearCookie("cpp_mc_sid");
    res.json({ ok: true });
  });
});

/** Persist learning progress for the signed-in account (server is source of truth). */
app.patch("/api/me/progress", (req, res) => {
  const user = sessionUser(req);
  if (!user) {
    res.status(401).json({ error: "Sign in required." });
    return;
  }
  const progress = parseProgressBody(req.body);
  if (!progress) {
    res.status(400).json({ error: "Invalid progress payload." });
    return;
  }
  const updated = updateUserProgress(user.id, progress);
  if (!updated) {
    res.status(404).json({ error: "User not found." });
    return;
  }
  res.json({ user: updated });
});

app.get("/api/auth/google", (req, res) => {
  const next = safeOAuthNext(req.query.next);
  if (!googleConfigured()) {
    const q = new URLSearchParams({
      authError: "Google sign-in is not configured.",
    });
    if (next) q.set("next", next);
    res.redirect(`${APP_URL}/login?${q}`);
    return;
  }
  const client = new OAuth2Client(
    process.env.GOOGLE_CLIENT_ID,
    process.env.GOOGLE_CLIENT_SECRET,
    GOOGLE_REDIRECT_URI,
  );
  const state = `${Date.now()}.${Math.random().toString(36).slice(2)}`;
  req.session.oauthState = state;
  req.session.oauthNext = next;
  const url = client.generateAuthUrl({
    access_type: "online",
    scope: ["openid", "email", "profile"],
    state,
    prompt: "select_account",
  });
  res.redirect(url);
});

// Changing this path requires updating Google Cloud Console.
app.get(GOOGLE_OAUTH_CALLBACK_PATH, async (req, res) => {
  const fail = (message: string) => {
    const next = req.session.oauthNext;
    req.session.oauthNext = undefined;
    const q = new URLSearchParams({ authError: message });
    if (next) q.set("next", next);
    res.redirect(`${APP_URL}/login?${q}`);
  };

  try {
    if (!googleConfigured()) {
      fail("Google sign-in is not configured.");
      return;
    }
    const code = String(req.query.code || "");
    const state = String(req.query.state || "");
    if (!code) {
      fail(
        req.query.error === "access_denied"
          ? "Google sign-in was cancelled."
          : "Google sign-in failed.",
      );
      return;
    }
    if (!req.session.oauthState || state !== req.session.oauthState) {
      fail("Invalid sign-in state. Please try again.");
      return;
    }
    req.session.oauthState = undefined;

    const client = new OAuth2Client(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      GOOGLE_REDIRECT_URI,
    );
    const { tokens } = await client.getToken(code);
    if (!tokens.id_token) {
      fail("Google did not return an ID token.");
      return;
    }
    const ticket = await client.verifyIdToken({
      idToken: tokens.id_token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });
    const payload = ticket.getPayload();
    if (!payload?.email || !payload.sub || !payload.email_verified) {
      fail("Google account email could not be verified.");
      return;
    }

    const user = upsertGoogleUser({
      googleId: payload.sub,
      email: payload.email,
      name: payload.name || payload.email.split("@")[0],
      avatarUrl: payload.picture,
    });
    req.session.userId = user.id;
    const next = safeOAuthNext(req.session.oauthNext) || "/lessons";
    req.session.oauthNext = undefined;
    req.session.oauthState = undefined;
    res.redirect(`${APP_URL}${next}`);
  } catch (error) {
    console.error("[auth/google/callback]", error);
    fail("Google sign-in failed. Please try again.");
  }
});

app.get("/api/admin/users", (req, res) => {
  const user = sessionUser(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  res.json({ users: listPublicUsers() });
});

app.patch("/api/admin/users/:id/role", (req, res) => {
  const user = sessionUser(req);
  if (!user || user.role !== "admin") {
    res.status(403).json({ error: "Forbidden" });
    return;
  }
  const role = req.body?.role;
  if (role !== "student" && role !== "admin") {
    res.status(400).json({ error: "Invalid role" });
    return;
  }
  const updated = updateRole(req.params.id, role);
  if (!updated) {
    res.status(404).json({ error: "User not found" });
    return;
  }
  res.json({ user: updated });
});

const runControllers = createRunControllers();
registerRunRoutes(app, sessionUser, runControllers);

/** Dev-only: compare this string to Google Cloud Console → Authorized redirect URIs. */
app.get("/api/auth/debug-redirect", (_req, res) => {
  if (process.env.NODE_ENV === "production") {
    res.status(404).json({ error: "Not found" });
    return;
  }
  res.json({
    appUrl: APP_URL,
    callbackPath: GOOGLE_OAUTH_CALLBACK_PATH,
    redirectUri: GOOGLE_REDIRECT_URI,
  });
});

const isProd = process.env.NODE_ENV === "production";
if (isProd) {
  const dist = path.join(__dirname, "..", "dist");
  app.use(express.static(dist));
  app.use((req, res, next) => {
    if (req.path.startsWith("/api")) return next();
    if (req.method !== "GET" && req.method !== "HEAD") return next();
    res.sendFile(path.join(dist, "index.html"));
  });
}

if (!Number.isFinite(PORT) || PORT <= 0) {
  console.error(`[server] Invalid PORT: ${process.env.PORT}`);
  process.exit(1);
}

const server = http.createServer(app);

attachRunWebSocket({
  server,
  sessionMiddleware: sessionMiddleware as express.RequestHandler,
  sessionUser: (req) => {
    const sid = (req as express.Request).session?.userId;
    if (!sid) return null;
    const stored = findById(sid);
    return stored ? toPublicUser(stored) : null;
  },
  allowedOrigin: APP_URL,
  concurrencyGate: runControllers.concurrencyGate,
  rateLimiter: runControllers.rateLimiter,
});

app.get("/api/health", (_req, res) => {
  res.status(200).json({ ok: true });
});

server.listen(PORT, HOST, () => {
  console.log(`[server] listening on http://${HOST}:${PORT}`);
  console.log(`[server] APP_URL=${APP_URL}`);
  console.log(`Google OAuth redirect URI: ${GOOGLE_REDIRECT_URI}`);
  console.log(`[run] interactive WebSocket at /api/run/ws`);
  void getSandboxCapabilities(true).then((caps) => {
    console.log(`[run] sandbox mode=${caps.mode} — ${caps.message}`);
    if (caps.mode === "none" && !caps.allowUnsafeLocal) {
      console.warn(
        "[run] /api/run will return 503 until Docker or bubblewrap is available.",
      );
    }
  });
});

server.on("error", (err: NodeJS.ErrnoException) => {
  if (err.code === "EADDRINUSE") {
    console.error(
      `[server] Port ${PORT} is already in use.\n` +
        `  Stop the old API process (e.g. \`fuser -k ${PORT}/tcp\`) or set a free PORT in .env.`,
    );
  } else {
    console.error("[server] Failed to start:", err);
  }
  process.exit(1);
});
