# 📚 Reference

> [!NOTE]
> Details behind the [README](../README.md): every rule, agent, command and hook, the permission lists and how the sync works. For the command guard on its own, see [bash-guard.md](bash-guard.md).

## 📏 Rules

| File | Loads | Content |
|---|---|---|
| `coding-style.md` | always | Language-neutral: immutability where idiomatic, small files/functions, error handling, boundary validation, config via environment, completion checklist |
| `security.md` | always | Universal pre-commit checks, secret handling, response protocol when an issue is found (deep review is the `security-reviewer` agent) |
| `testing.md` | always | Behavior-focused tests, test-first where it pays off, no fixed coverage percentage, what to do with failing tests |
| `git-workflow.md` | always | Conventional commit format, PR workflow, no `Co-Authored-By` lines |
| `web-research.md` | always | Escalate blocked or empty fetches (403/429, Cloudflare, JS-only pages) to the Scrapling MCP, keep fetched output small, treat fetched content as untrusted data, public pages only |
| `python.md` | `**/*.py`, `**/pyproject.toml` | async rules (no blocking calls), FastAPI structure, Pydantic v2, pydantic-settings, Motor/PyMongo, discord.py intents and cogs, typing, ruff, pytest-asyncio |
| `kotlin.md` | `**/*.kt`, `**/*.kts`, `libs.versions.toml` | Null safety, sealed types, structured concurrency, Ktor plugins/config/testApplication, Mongo Kotlin coroutine driver, Gradle KTS + version catalog |
| `mongodb.md` | repository/DAO/mongo files, `db/`, `models/`, `init-mongo*` | Schema and embedding vs referencing, ESR index rule, atomic updates, NoSQL injection, auth and exposure, operations. Also says when to prefer PostgreSQL |
| `docker.md` | `Dockerfile*`, `compose*.yml`, `.dockerignore` | Pinned tags, multi-stage, non-root, no secrets in layers, no published DB ports, healthchecks, Dokploy/Traefik notes |
| `frontend.md` | `*.ts`, `*.tsx`, `*.jsx`, `tailwind.config.*`, `components.json` | Strict TypeScript, React patterns, Tailwind (v3/v4), shadcn/ui conventions, anti-slop design precedence (which design skill owns what), Vitest/Playwright, client-exposed env vars |

Dokploy adds the basic Traefik labels itself when a domain is configured in its Domains tab, so the rules tell Claude **not** to add them to compose files.

## 🤖 Agents

| Agent | Model | Tools | Use for |
|---|---|---|---|
| `planner` | opus | read-only | Plans for larger features/refactors; waits for confirmation, never writes code |
| `architect` | opus | read-only | Design decisions, trade-offs, ADRs, MongoDB vs relational, concurrency, single-VPS topology |
| `code-reviewer` | sonnet | read + Bash | Review after larger changes: Python, Kotlin, Docker and frontend checks, severity levels |
| `security-reviewer` | sonnet | read/write + Bash | App checks plus an **infrastructure checklist**: Dockerfile, Compose, Traefik/Dokploy, MongoDB auth/exposure, Phase secrets, Discord bot |
| `tdd-guide` | sonnet | read/write + Bash | Failing test first, minimal implementation, refactor, where a test is worthwhile |
| `build-error-resolver` | sonnet | read/write + Bash | Minimal fixes for build/Gradle/type/Docker build errors |
| `refactor-cleaner` | sonnet | read/write + Bash | Dead-code cleanup with per-stack tools (vulture, detekt, knip), tests around each batch |
| `e2e-runner` | sonnet | read/write + Bash | Playwright flows for the React frontend only |
| `doc-updater` | haiku | read/write + Bash | Keeps README/docs in sync with code, opt-in codemaps |

Model strategy: Opus only where reasoning dominates (planning, architecture), Haiku for documentation, Sonnet for the rest. Only aliases (`sonnet`, `opus`, `haiku`) are used, never pinned model IDs, so the setup does not go stale.

**Sonnet works, Opus judges:** for security-critical changes (auth, secrets, exposed infrastructure) spawn the reviewer with an override: `security-reviewer` with `model: opus`. For whole sessions, `/model opusplan` uses Opus in plan mode and Sonnet for execution.

## ⌨️ Commands

| Command | Model-invocable | Purpose |
|---|---|---|
| `/plan` | yes | Restate requirements, assess risks, plan, **wait for confirmation** before any code |
| `/verify [quick\|full\|pre-commit\|pre-pr]` | yes | Build, types, lint, tests, secrets and git checks for the detected stack |
| `/build-fix` | yes | Fix build/type errors one at a time until green |
| `/test-coverage` | yes | Coverage for the detected stack, find untested risky paths, write meaningful tests |
| `/e2e` | yes | Playwright E2E for the frontend via `e2e-runner` |
| `/refactor-clean` | manual only | Dead code and unused dependency removal |
| `/update-docs` | manual only | Sync docs with sources of truth |
| `/orchestrate` | manual only | Sequential multi-agent workflow (feature, bugfix, refactor, security, custom) |
| `/checkpoint` | manual only | Named checkpoints via commit or stash plus log |
| `/eval` | manual only | Eval-driven development |
| `/learn` | manual only | Save a reusable pattern as `~/.claude/skills/<name>/SKILL.md` after confirmation |

Commands marked "manual only" use `disable-model-invocation: true`, so their descriptions cost no always-loaded tokens. Toolchain detection (`pyproject.toml`/`uv.lock`, `build.gradle.kts`, `package.json` + lockfile, compose files) replaces any hardcoded package manager.
## 🧰 Skills

This repository contains no skill files, because the skills I run are other people's work. [`skills/README.md`](../skills/README.md) lists them with their upstreams and licenses. On my own machines `skills/` is synced from a private copy.

`skills/synced/` is a bucket that Claude Desktop manages itself (docx, pdf, pptx, xlsx and so on). It is git-ignored and should not be edited by hand.

## 🪝 Hooks

All hooks are registered in `settings.json`. **`disableAllHooks` is the master switch**: while it is `true`, nothing below runs, including the sync hooks. Turn it to `false` when you want everything active.

| Event | Matcher | Script | What it does |
|---|---|---|---|
| SessionStart | `startup\|resume` | `sync.sh` | Pulls the config repo (`git pull --ff-only --autostash`) |
| SessionEnd | all | `push.sh` | Runs `secret-gate.js`, then commits changes and pushes to `origin/master` |
| PreToolUse | `Bash\|PowerShell` | `bash-guard.js` | 1) blocks dangerous commands, 2) scans changes for secrets before `git commit` |
| PostToolUse | `Edit\|Write` | `format-on-edit.js` | Formats the edited file with the project's own formatter |
| Notification | `permission_prompt\|idle_prompt\|elicitation_dialog` | `notify.js` | Plays a sound (`afplay` on macOS, `Media.SoundPlayer` on Windows) |

### `bash-guard.js`

Exit code `2` blocks the call and sends stderr to Claude. Any internal error exits `0`, so the guard can never lock a session.

**Blocks** (a second line of defense behind the deny rules, which only match the usual spelling):

- force pushes: `--force`, `--force-with-lease`, `-f`, `+refspec`
- recursive deletes of root-like paths: `/`, `~`, `$HOME`, `.`, `..`, drive roots (`rm -rf` and `Remove-Item -Recurse`)
- downloads piped into a shell: `curl ... | sh`, `irm ... | iex`
- `docker system prune -a/--volumes`, `docker volume rm/prune`
- MongoDB `dropDatabase`

**Secret scan before `git commit`:** scans the staged diff, or, for `git add ... && git commit` and `commit -a`, the working tree plus untracked files. It detects AWS keys, GitHub tokens, Anthropic/OpenAI-style keys, Slack and Google keys, Discord bot tokens, Phase service tokens, private key blocks, connection strings with credentials, hardcoded `password/token/api_key = "..."` assignments, and committed `.env`, `*.pem`, `*.key`, SSH key files (`.env.example` is allowed). Reports show file, line and pattern name, **never the value**. An intentional test fixture can carry the comment `secret-scan:allow`.

### `format-on-edit.js`

Runs only when the project clearly uses the tool, never uses the network (no `npx`), never goes through a shell:

| Files | Formatter | Condition |
|---|---|---|
| `.py` | `ruff format` | `ruff.toml`/`.ruff.toml` or `[tool.ruff` in `pyproject.toml`, and `ruff` on PATH |
| `.ts .tsx .js .jsx .mjs .cjs .css` | local `prettier` | `node_modules/prettier` exists |
| `.kt .kts` | `ktlint -F` | build file mentions ktlint, and `ktlint` is an executable on PATH |

### Sync hooks

`sync.sh` and `push.sh` are what keep the machines in step. They log to `sync-hook.log` and always exit `0`.

- `sync.sh`: if `~/.claude/.git` is missing, clones the repo (SSH, then HTTPS) and checks it out; otherwise `fetch` and `pull --ff-only --autostash` on `master`.
- `push.sh`: `git add -A` (bounded by the `.gitignore` whitelist), then `secret-gate.js`, commit `auto-sync from <host> (<date>)`, push; on failure `pull --rebase --autostash` and one retry.
- `secret-gate.js`: scans the staged diff with the same scanner as `bash-guard.js`. On a finding, or on any internal error, it exits `1`; `push.sh` then unstages everything and skips that sync, and `sync-hook.log` records file, line and pattern (never the value). Unlike `bash-guard.js` it fails closed, because the auto-sync commit would otherwise bypass the scan.

`push.sh` commits without a review step, which is why the whitelist and the secret scan matter.

**Using these scripts yourself:** `sync.sh` and `push.sh` are written for my setup and will not work for you as they are. They hardcode my config repository (`SSH_URL` and `HTTPS_URL` in `sync.sh`, plus the repository named in the comments), the branch `master` (`BRANCH`), and the directory `$HOME/.claude` (`DIR`). Change those variables to your own repository, or do not register the two hooks in `settings.json`. Be careful with `push.sh`: it commits and pushes everything your `.gitignore` allows, so keep the whitelist and the secret gate in place. Do not modify or move these two scripts without checking both hook entries in `settings.json`.

## 🔐 Permissions

Evaluation order is **deny, then ask, then allow**; an `allow` cannot override a `deny` or an `ask`. Rules exist in pairs for the `Bash` and `PowerShell` tools (same pattern shape). Counts: 142 allow, 103 deny, 118 ask.

**Deny (blocked):**
- Reading or editing secrets: `.env`, `.env.local/.dev/.production/...`, `secrets/**`, `*.pem`, `*.key`, `*.p12`, `id_rsa*`, `~/.ssh`, `~/.aws`, `~/.azure`, `~/.kube`, `~/.gnupg`, gcloud and `gh` configs, `~/.phase`, `~/.docker/config.json`, `~/.npmrc`, `~/.netrc`, `~/.claude/.credentials.json`
- Shell reads of env files (`cat`, `type`, `Get-Content ... .env*`)
- Force pushes, `git clean -fdx`, root-like `rm -rf`, `mkfs`, `dd`, `chmod -R 777`
- Pipe-to-shell (including bare `sh`/`bash`/`zsh` and `Invoke-Expression`)
- `docker volume rm/prune`, `docker system prune -a/--volumes`, `dropDatabase`, `gh repo delete`, `gh api ... DELETE`

**Ask (confirmation):**
- git: `push`, `reset --hard`, `clean`, `branch -D`, `rebase`, `restore`, `checkout --`
- package installs: npm/pnpm/yarn, `pip`, `uv add`
- Docker: `compose up/down/exec/run`, `run`, `exec`, `rm`, `stop`, `kill`, `volume *`, `system prune`
- MongoDB tools: `mongosh`, `mongodump`, `mongorestore`, import/export
- GitHub writes: PR create/merge/close/edit, issues, releases, `gh api` POST/PUT/PATCH
- Phase CLI: `phase secrets`, `phase run`, `phase console`
- Network and remote: `curl`, `wget`, `ssh`, `scp`, `rsync`, `sudo`, `Invoke-WebRequest`
- Other deletes: `rm -r/-rf`, `Remove-Item`

**Allow (no prompt):** `git status/diff/log/show/add/commit/switch/stash`, `pytest`, `ruff`, `mypy` (also via `uv run` / `python -m`), `./gradlew test|build|check|compile|assemble|tasks|dependencies|ktlint|detekt` (and `.\gradlew` in PowerShell), `npm|pnpm test/lint/build/typecheck`, `npx tsc|vitest|eslint`, read-only `docker`/`docker compose` commands, read-only `gh` commands and `gh api`, `WebSearch`, and `WebFetch` for documentation domains (GitHub, Python, Kotlin, Ktor, FastAPI, Pydantic, discord.py, MongoDB, Docker, Dokploy, Phase, React, Tailwind, shadcn, PyPI, Claude Code docs).

Broad allows such as `python *`, `node *`, `npx *` and `gh:*` are deliberately absent, because each of them permits arbitrary code.

**Honest limit:** Bash/PowerShell deny rules match the command text. They are not a security boundary (a different spelling or `sh -c` can bypass them), which is why `bash-guard.js` exists as a second layer. A `Read` deny also blocks `Edit`/`Write` on the same path, but does not stop a subprocess from reading a file. For hard isolation use the OS sandbox.

## 🔌 Plugins and MCP

Two plugins are enabled in `enabledPlugins`:

| Plugin | Why |
|---|---|
| `superpowers` | Process skills for debugging, brainstorming and planning |
| `kotlin-lsp` | Kotlin language server, which costs no context |

The rest are listed with `false` on purpose. Several duplicate the agents and commands in this repo and collide with them by name (`code-reviewer`, `refactor-clean`), and `security-guidance` runs Python hooks on every edit and prompt. I also keep the `github` plugin off, since I use the `gh` CLI for everything GitHub.

Budget goal: fewer than 10 active MCP servers and fewer than 80 tools. Other MCP sources: `scrapling` (user scope, a Scrapling MCP server you host yourself; fallback for blocked pages, triggered by `rules/web-research.md`) and the claude.ai connectors (Notion, Claude Docs). Tool search keeps MCP schemas deferred.

## 🎛️ Models and settings

| Setting | Value | Reason |
|---|---|---|
| `model` | `sonnet` | Cheap default for daily work |
| `env.CLAUDE_AUTOCOMPACT_PCT_OVERRIDE` | `75` | Compact before the window gets crowded |
| `permissions.defaultMode` | `auto` | A classifier handles routine actions; the deny and ask rules still apply |
| `attribution` | `commit: ""`, `pr: ""` | No `Co-Authored-By` or "Generated with" lines (the schema wants strings, not booleans) |
| `statusLine` | `npx -y ccstatusline@2.2.30` | Version pinned instead of `@latest` (supply-chain risk) |
| `disableAllHooks` | `false` | Master switch. Set it to `true` to turn every hook off at once |

No model ID is pinned, so the `opus` alias always resolves to the current Opus.

## 🔄 Sync across machines

On my machines the config directory is itself a git repo (a private one, branch `master`). This repository is a cleaned copy of it. `.gitignore` is a **whitelist**: everything is ignored (`*`), and only the following is re-included:

`.gitignore`, `.gitattributes`, `README.md`, `LICENSE`, `THIRD_PARTY_NOTICES.md`, `settings.json`, `CLAUDE.md`, `docs/**`, `scripts/**`, `rules/**`, `agents/**`, `commands/**`, `skills/**` (except `skills/synced/`), `hooks/**`

Never synced (stay local): `.credentials.json`, `history.jsonl`, `projects/`, `sessions/`, `plugins/`, `cache/`, `backups/`, `file-history/`, `paste-cache/`, `shell-snapshots/`, `security/`, logs, and `contexts/`.

A new top-level directory is **ignored by default**. If a new file does not show up in `git status`, add it to the whitelist (the `!dir/` and `!dir/**` pair, parent first). Check with `git check-ignore -v <path>`.

Line endings: `* text=auto`, `*.sh text eol=lf`. Keep `.sh` files on LF.

Do not add keys with secrets to the `env` block of `settings.json`, because that file is synced.

## 💻 Setting up a new machine

1. Install Git, Node.js and Claude Code. On Windows, install Git for Windows (Git Bash) so `bash` resolves to it and not the WSL stub.
2. Set `git config --global user.name` and `user.email`, and make sure `git push` to the repo works (credential manager or SSH key).
3. Clone the config repo into `~/.claude` (or let `sync.sh` bootstrap it).
4. Install the tools the hooks use if you want formatting: `ruff`, `ktlint`, and `prettier` inside each frontend project.
5. Sign in to the plugin marketplaces; plugins install themselves from `enabledPlugins`.
6. Test the hooks before enabling them:
   ```
   echo '{"tool_input":{"command":"git push --force"}}' | node ~/.claude/scripts/hooks/bash-guard.js; echo $?   # must print 2
   node ~/.claude/scripts/hooks/notify.js                                                                         # must play a sound
   ```
7. Set `disableAllHooks` to `false`.
8. Register the Scrapling MCP once per machine. User-scope servers live in `~/.claude.json`, which is not synced. Check the URL path, transport and auth of your own server first, and pass any token through an environment variable or your secret manager, never inline in a committed file:
   ```
   claude mcp add --scope user --transport http scrapling https://<your-scrapling-host>/mcp
   claude mcp list    # scrapling must show as connected
   ```

## 🛠️ Maintaining the setup

- **New stack-specific rule:** create `rules/<name>.md` with a `paths:` list in the frontmatter. Always quote globs and use a YAML list. Without `paths:` a rule is always loaded; keep those few and short.
- **New agent:** `agents/<name>.md` with `name` (equal to the filename), a one-sentence `description` (this is always loaded, keep it precise), `tools`, and `model` as an alias.
- **New command:** `commands/<name>.md` with `description`, and `disable-model-invocation: true` if it should only run when typed.
- **New permission:** add it to the right list in `settings.json`; remember `deny` and `ask` beat `allow`. Prefer specific patterns over `tool *`.
- **New hook:** write a Node script in `scripts/hooks/`, read the JSON from stdin, exit `2` to block, never throw. Test it with a sample payload before registering it.
- **Check what the next sync would commit:** `git -C ~/.claude add -n -A`.
- **Compare sizes** of the always-loaded part after changes; keep `CLAUDE.md` well below 200 lines.

## ✅ Verification

Checked when the setup was built:

- `settings.json` is valid JSON; no rule appears in more than one of allow/deny/ask.
- Frontmatter of all agents, commands and rules parses; agent models are valid aliases; every referenced script and agent exists.
- 36 dry-run cases of the hook scripts in a throwaway repository, including empty and malformed stdin (all pass), plus the real command string from `settings.json` under Git Bash.
- Secrets, history and logs are confirmed ignored by `git check-ignore`.
- Tested on both machines, the Windows desktop and the MacBook: the hooks, the sync between them and the `notify.js` sound all work on macOS as well.

## ⚠️ Known limits and unverified assumptions

- **SessionEnd budget:** the docs reportedly give SessionEnd hooks only a short shared time budget (about 1.5 s). If pushes silently do not happen, `push.sh` may be cut off. Unconfirmed. `push.sh` also runs on every `/clear`.
- Shell deny rules are best effort, see the Permissions section above.
- The Phase CLI syntax in the `ask` rules and the Phase token format in the secret scan are best guesses.
- `ktlint` on Windows is often a `.bat` file; `format-on-edit.js` calls executables without a shell and will skip it silently in that case.
- The skill description budget and the full `statusLine` schema were not verified against the docs.
- `rules/web-research.md` assumes the MCP server is registered under the name `scrapling` (tool prefix `mcp__scrapling__`). The path, transport and auth of a self-hosted server depend on how you run it and were not verified here.

## ⏪ Rollback

- A single file: `git -C ~/.claude checkout HEAD -- <path>` restores the last committed version (uncommitted changes to that file are lost).
- Disable all automation immediately: set `"disableAllHooks": true` in `settings.json`.
- Disable a single plugin: set its entry in `enabledPlugins` to `false`.

