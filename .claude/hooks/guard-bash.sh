#!/usr/bin/env bash
# PreToolUse hook for the Bash tool.
# Reads the hook JSON on stdin and denies a short list of destructive commands.
set -euo pipefail

input="$(cat)"
cmd="$(printf '%s' "$input" | jq -r '.tool_input.command // empty')"
[ -z "$cmd" ] && exit 0

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

# Normalize whitespace for matching.
c="$(printf '%s' "$cmd" | tr -s '[:space:]' ' ')"

# Recursive force delete of root, home or top-level wildcard.
if printf '%s' "$c" | grep -Eq '(^|[;&| ])rm +(-[a-zA-Z]*r[a-zA-Z]*f|-[a-zA-Z]*f[a-zA-Z]*r|-r +-f|-f +-r)[a-zA-Z]* +(/|/\*|~|~/|~/\*|\$HOME|\$HOME/|\$HOME/\*|\*)( |$)'; then
  deny "Blocked: recursive force delete of /, home or a top-level wildcard."
fi

# Force push (allow --force-with-lease).
if printf '%s' "$c" | grep -Eq 'git( +-[^ ]+)* +push' && \
   printf '%s' "$c" | grep -Eq '( --force( |$)| -f( |$)| \+[^ ]+)'; then
  deny "Blocked: force push. Use --force-with-lease on a feature branch if you really need it, and ask the user first."
fi

# Direct push to main or master.
if printf '%s' "$c" | grep -Eq 'git( +-[^ ]+)* +push( +[^ ]+)* +(HEAD:)?(refs/heads/)?(main|master)( |$)'; then
  deny "Blocked: pushing directly to main/master. Push a feature branch and open a pull request."
fi

# Commands that discard uncommitted work.
if printf '%s' "$c" | grep -Eq 'git( +-[^ ]+)* +reset +.*--hard|git( +-[^ ]+)* +clean +-[a-zA-Z]*f'; then
  deny "Blocked: this discards uncommitted work (git reset --hard / git clean -f). Ask the user before running it."
fi

# Disk-level destruction.
if printf '%s' "$c" | grep -Eq '(^|[;&| ])(sudo +)?(mkfs(\.[a-z0-9]+)?|wipefs) ' || \
   printf '%s' "$c" | grep -Eq '(^|[;&| ])(sudo +)?dd .*of=/dev/' || \
   printf '%s' "$c" | grep -Eq '(^|[;&| ])(sudo +)?shred .*/dev/'; then
  deny "Blocked: disk-level write or format command."
fi

# Remote script piped into a shell.
if printf '%s' "$c" | grep -Eq '(curl|wget)[^|]*\| *(sudo +)?(ba|z|da)?sh( |$)'; then
  deny "Blocked: piping a downloaded script into a shell. Download it, show it to the user, then run it if approved."
fi

# World-writable recursive permissions.
if printf '%s' "$c" | grep -Eq 'chmod +-R +0?777'; then
  deny "Blocked: recursive chmod 777."
fi

exit 0
