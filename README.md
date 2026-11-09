# C++ MasterClass

A phone-first C++ course with lessons, Drive video/PDF links, quizzes, a **real sandboxed g++ (C++20)** playground, bookmarks, and progress tracking.

## Requirements

- Node.js 20.19+ or 22.12+
- npm
- For `/api/run`: **Docker** (preferred) **or** [bubblewrap](https://github.com/containers/bubblewrap) + host `g++`

## Run locally

```sh
cp .env.example .env
npm install
npm run dev
```

This starts:

- Vite on `http://localhost:3000` (UI)
- API on `http://localhost:8787` (proxied as `/api` — auth + compiler)

Open the Vite URL. Sign-in is Google OAuth only — set `GOOGLE_CLIENT_ID` and `GOOGLE_CLIENT_SECRET` in `.env` (see below).

## Real compiler sandbox (`POST /api/run`)

The IDE Sandbox and lesson Code tab call an authenticated API that:

1. Writes `main.cpp` in a unique temp dir
2. Compiles with `g++ -std=c++20 -O1 -Wall -Wextra` (optional ASan: `-fsanitize=address,undefined -g`)
3. Runs the binary with your stdin
4. Always deletes the temp dir

**Security model**

| Mode | How | When |
|---|---|---|
| `docker` | `docker run --network none --memory 128m --pids-limit 64 --cap-drop ALL --read-only …` | Preferred when the Docker daemon is up |
| `bwrap` | bubblewrap + `--unshare-net`, minimal host binds | Auto-fallback if Docker is down |
| `none` | Host `g++` **unsandboxed** | Only if `ALLOW_UNSAFE_LOCAL_EXEC=true` (dev). Production must refuse. |

Never interpolates user code into a shell string — only `spawn` with argv arrays.

### Docker image

```sh
npm run sandbox:build
# → cpp-masterclass-sandbox:local  (see server/Dockerfile.sandbox)
```

Then set `SANDBOX_MODE=docker` (or leave `auto`) and restart the API.

### Host g++ (for bwrap / status checks)

```sh
# Fedora
sudo dnf install gcc-c++ bubblewrap
# Debian/Ubuntu
sudo apt install g++ bubblewrap
```

### Limits (env)

See `.env.example`: `COMPILE_TIMEOUT_MS`, `RUN_TIMEOUT_MS`, `MAX_CODE_BYTES`, `MAX_STDIN_BYTES`, `MAX_OUTPUT_BYTES`, `MAX_CONCURRENT_RUNS`, `RUN_RATE_LIMIT_PER_MINUTE`, `SANDBOX_MODE`, `ALLOW_UNSAFE_LOCAL_EXEC`.

### Tests

```sh
npm run test:run
```

Covers hello world, compile diagnostics, cin, timeout, segfault, truncation, fork-bomb containment, `/etc/passwd` blocked in sandbox, unauthenticated 401, and refuse-when-no-sandbox.

## Environment variables

Copy `.env.example` → `.env` and fill in:

| Variable | Purpose |
|---|---|
| `APP_URL` | Public base URL (no trailing slash). Local: `http://localhost:3000` |
| `SESSION_SECRET` | Signed httpOnly session cookie secret (required in production) |
| `GOOGLE_CLIENT_ID` | Google OAuth client ID (optional) |
| `GOOGLE_CLIENT_SECRET` | Google OAuth client secret (optional) |
| `PORT` | Auth API port (default `8787`) |
| `SANDBOX_MODE` | `auto` \| `docker` \| `bwrap` \| `none` |
| `ALLOW_UNSAFE_LOCAL_EXEC` | `true` only for local unsandboxed runs |

If Google vars are missing, the app still runs and the Google button is hidden.

## Google OAuth setup

1. Open [Google Cloud Console](https://console.cloud.google.com/) → APIs & Services → Credentials.
2. Create an **OAuth 2.0 Client ID** (Web application).
3. Authorized JavaScript origins (exact, no path):
   - `http://localhost:3000` (local)
   - `https://lance-2.tail735d2a.ts.net` (this Tailscale host)
4. Authorized redirect URIs (must match `APP_URL` + `/api/auth/google/callback` exactly):
   - `http://localhost:3000/api/auth/google/callback`
   - `https://lance-2.tail735d2a.ts.net/api/auth/google/callback`
5. Set `APP_URL` in `.env` to the origin you are using (`https`, no trailing slash).  
   Do **not** override `APP_URL` on the command line unless you intend to change the redirect URI.
6. Restart the API and confirm the startup line: `Google OAuth redirect URI: …`.  
   In development, `GET /api/auth/debug-redirect` returns the same string.

Changing the callback path (`/api/auth/google/callback`) requires updating Google Cloud Console.

## Scripts

```sh
npm run lint
npm test
npm run test:run
npm run sandbox:build
npm run build
npm start          # production: serves dist/ + /api on PORT
```

## Deploy notes

- Needs a **long-running Node process** (not serverless) for `child_process` / Docker.
- Build with `npm run build`, then run `APP_URL=https://your-domain.com SESSION_SECRET=… npm start`.
- Prefer Docker sandbox in production. Never set `ALLOW_UNSAFE_LOCAL_EXEC` on a public host.
- Never commit `.env`. `server/data/users.json` is local user storage (gitignored).

## Notes data (UI removed)

The Notes tab / bottom-nav entry / dashboard tile were removed from the UI. Notes remain on the user object (`notes` field) and are persisted with account progress on the server (`PATCH /api/me/progress`), with a local cache under `cpp-masterclass:v1:users`. Sessions are stored on disk under `server/data/sessions/` so logins survive API restarts.
