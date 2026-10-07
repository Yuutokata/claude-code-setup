#!/usr/bin/env bash
# SessionStart hook: syncs ~/.claude with github.com/Yuutokata/claude-config
# Design goals: never block a session, never prompt for credentials,
# stay silent unless something actually changed.

set -u
export GIT_TERMINAL_PROMPT=0

DIR="$HOME/.claude"
SSH_URL="git@github.com:Yuutokata/claude-config.git"
HTTPS_URL="https://github.com/Yuutokata/claude-config.git"
BRANCH="master"
LOG="$DIR/sync-hook.log"

log() { printf '%s %s\n' "$(date '+%Y-%m-%d %H:%M:%S')" "$*" >> "$LOG" 2>/dev/null || true; }

command -v git >/dev/null 2>&1 || exit 0
mkdir -p "$DIR" 2>/dev/null || true

# --- First run on this machine: adopt the repo into the existing ~/.claude ---
if [ ! -d "$DIR/.git" ]; then
  tmp="$(mktemp -d 2>/dev/null)" || exit 0
  if git clone --quiet "$SSH_URL" "$tmp/repo" 2>>"$LOG" || \
     git clone --quiet "$HTTPS_URL" "$tmp/repo" 2>>"$LOG"; then
    if mv "$tmp/repo/.git" "$DIR/.git" 2>>"$LOG"; then
      # Overwrite tracked files (settings.json, skills/, ...) with the repo
      # version; untracked local state (projects/, todos/, history) stays.
      git -C "$DIR" checkout --quiet -- . 2>>"$LOG" || true
      log "initial sync complete"
      echo "claude-config: initial sync from origin/$BRANCH complete"
    fi
  else
    log "initial clone failed (auth? network?)"
  fi
  rm -rf "$tmp" 2>/dev/null || true
  exit 0
fi

# --- Every later start: fast-forward to origin ---
before="$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null || echo '?')"
git -C "$DIR" fetch --quiet origin "$BRANCH" 2>>"$LOG" || { log "fetch failed (offline?)"; exit 0; }
git -C "$DIR" pull --ff-only --autostash --quiet 2>>"$LOG" || { log "pull failed (diverged?)"; exit 0; }
after="$(git -C "$DIR" rev-parse --short HEAD 2>/dev/null || echo '?')"

[ "$before" != "$after" ] && echo "claude-config synced: $before -> $after"
exit 0
