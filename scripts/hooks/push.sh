#!/usr/bin/env bash
# SessionEnd hook: commits local config changes in ~/.claude and pushes
# them back to github.com/Yuutokata/claude-config
# Never blocks, never prompts, no-ops when nothing changed.

set -u
export GIT_TERMINAL_PROMPT=0

DIR="$HOME/.claude"
BRANCH="master"
LOG="$DIR/sync-hook.log"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG" 2>/dev/null || true; }

command -v git >/dev/null 2>&1 || exit 0
[ -d "$DIR/.git" ] || exit 0   # repo not adopted on this machine yet

cd "$DIR" 2>/dev/null || exit 0

# Stage everything the .gitignore allows.
# The whitelist .gitignore is what keeps credentials/local state out.
git add -A 2>>"$LOG" || true

# Nothing staged -> nothing to do
if git diff --cached --quiet 2>/dev/null; then
  exit 0
fi

# Secret gate: this commit bypasses bash-guard.js, so scan it here. Fails closed
# (also when node is missing). Unstage and skip the sync instead of committing.
if ! command -v node >/dev/null 2>&1 || ! node "$DIR/scripts/hooks/secret-gate.js" 2>>"$LOG"; then
  git reset --quiet 2>>"$LOG" || true
  log "sync skipped: secret gate blocked the commit (see above)"
  exit 0
fi

host="$(hostname 2>/dev/null || echo unknown)"
git commit --quiet -m "auto-sync from $host ($(date '+%Y-%m-%d %H:%M'))" 2>>"$LOG" || exit 0

if ! git push --quiet origin "$BRANCH" 2>>"$LOG"; then
  # Another machine pushed in the meantime -> rebase once, retry once
  git pull --rebase --autostash --quiet origin "$BRANCH" 2>>"$LOG" || { log "push: rebase failed"; exit 0; }
  git push --quiet origin "$BRANCH" 2>>"$LOG" || { log "push: failed after rebase"; exit 0; }
fi

log "pushed to origin/$BRANCH"
exit 0
