# Production image for Koyeb (and similar platforms).
# Serves the Vite SPA + Express API, with g++ and bubblewrap for /api/run.
FROM node:22-bookworm-slim

RUN apt-get update \
  && apt-get install -y --no-install-recommends \
    g++ \
    bubblewrap \
    ca-certificates \
    bsdutils \
    curl \
  && rm -rf /var/lib/apt/lists/*

WORKDIR /app

# Install JS deps first for better layer caching
COPY package.json package-lock.json ./
RUN npm ci

COPY . .

# Build the frontend into dist/ (served by Express in production)
RUN npm run build && npm prune --omit=dev

ENV NODE_ENV=production \
    HOST=0.0.0.0 \
    PORT=8000 \
    SANDBOX_MODE=bwrap

# Persist user data across restarts when a volume is mounted at /app/server/data
RUN mkdir -p /app/server/data

EXPOSE 8000

HEALTHCHECK --interval=30s --timeout=5s --start-period=20s --retries=3 \
  CMD curl -fsS "http://127.0.0.1:${PORT}/api/health" || exit 1

CMD ["npm", "start"]
