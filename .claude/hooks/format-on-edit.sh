#!/usr/bin/env bash
# PostToolUse hook for Edit and Write.
# Formats the edited file with the project's own tools and reports remaining lint errors.
# Exit 0: nothing to report. Exit 2: stderr is shown to Claude as feedback.
set -uo pipefail

input="$(cat)"
file="$(printf '%s' "$input" | jq -r '.tool_input.file_path // empty')"
root="${CLAUDE_PROJECT_DIR:-$(pwd)}"

[ -z "$file" ] && exit 0
[ -f "$file" ] || exit 0
case "$file" in
  "$root"/*) ;;
  *) exit 0 ;;   # outside the project
esac
case "$file" in
  */node_modules/*|*/vendor/*|*/.git/*|*/dist/*|*/build/*) exit 0 ;;
esac

cd "$root" || exit 0
problems=""

ext="${file##*.}"
case "$ext" in
  js|jsx|ts|tsx|mjs|cjs|json|css|scss|md|yaml|yml|html|vue|svelte)
    if [ -x node_modules/.bin/prettier ]; then
      node_modules/.bin/prettier --write "$file" >/dev/null 2>&1
    fi
    case "$ext" in
      js|jsx|ts|tsx|mjs|cjs|vue|svelte)
        if [ -x node_modules/.bin/eslint ]; then
          out="$(node_modules/.bin/eslint --fix "$file" 2>&1)" || problems="$out"
        fi
        ;;
    esac
    ;;
  py|pyi)
    if [ -f uv.lock ] && command -v uv >/dev/null 2>&1; then
      ruff=(uv run --quiet ruff)
    elif command -v ruff >/dev/null 2>&1; then
      ruff=(ruff)
    else
      ruff=()
    fi
    if [ ${#ruff[@]} -gt 0 ]; then
      "${ruff[@]}" format --quiet "$file" >/dev/null 2>&1
      out="$("${ruff[@]}" check --fix --quiet "$file" 2>&1)" || problems="$out"
    fi
    ;;
  go)
    command -v gofmt >/dev/null 2>&1 && gofmt -w "$file"
    ;;
  rs)
    command -v rustfmt >/dev/null 2>&1 && rustfmt --quiet "$file" >/dev/null 2>&1
    ;;
  php)
    if [ -x vendor/bin/pint ]; then
      vendor/bin/pint --quiet "$file" >/dev/null 2>&1
    fi
    ;;
esac

if [ -n "$problems" ]; then
  {
    echo "Lint errors remain in $file after auto-fix. Please fix them:"
    printf '%s\n' "$problems" | head -n 40
  } >&2
  exit 2
fi

exit 0
