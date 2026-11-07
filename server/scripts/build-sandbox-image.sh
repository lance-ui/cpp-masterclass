#!/usr/bin/env bash
set -euo pipefail
ROOT="$(cd "$(dirname "$0")/../.." && pwd)"
IMAGE="${SANDBOX_DOCKER_IMAGE:-cpp-masterclass-sandbox:local}"
echo "[sandbox] Building $IMAGE from server/Dockerfile.sandbox"
docker build -f "$ROOT/server/Dockerfile.sandbox" -t "$IMAGE" "$ROOT/server"
echo "[sandbox] Done. Set SANDBOX_MODE=docker (or auto) and restart the API."
