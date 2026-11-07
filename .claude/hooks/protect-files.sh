#!/usr/bin/env bash
# PreToolUse hook for Edit and Write.
# Denies changes to secrets, git internals and lockfiles.
set -euo pipefail

input="$(cat)"
path="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
[ -z "$path" ] && exit 0

name="$(basename "$path")"

deny() {
  jq -n --arg reason "$1" '{
    hookSpecificOutput: {
      hookEventName: "PreToolUse",
      permissionDecision: "deny",
      permissionDecisionReason: $reason
    }
  }'
  exit 0
}

# Environment files with real values. Example/sample/template files are allowed.
case "$name" in
  .env.example|.env.sample|.env.template|.env.dist) ;;
  .env|.env.*) deny "Blocked: $name may contain secrets. Edit .env.example instead and tell the user which variable to set." ;;
esac

# Keys and certificates.
case "$name" in
  *.pem|*.key|*.p12|*.pfx|id_rsa|id_rsa.*|id_ed25519|id_ed25519.*|*.keystore|*.jks)
    deny "Blocked: $name looks like a private key or certificate." ;;
esac

# Git internals.
case "$path" in
  */.git/*|.git/*) deny "Blocked: do not edit files inside .git/ directly. Use git commands." ;;
esac

# Lockfiles must change through the package manager.
case "$name" in
  package-lock.json|pnpm-lock.yaml|yarn.lock|bun.lockb|composer.lock|poetry.lock|uv.lock|Cargo.lock|Gemfile.lock|go.sum)
    deny "Blocked: $name should only change through the package manager (install/add/update commands), not by direct edits." ;;
esac

exit 0
