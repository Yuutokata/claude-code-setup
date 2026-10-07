## Stack and preferences

- Main stacks: Kotlin (Ktor, Gradle Kotlin DSL, MongoDB coroutine driver), Python (FastAPI, Motor/PyMongo, discord.py, async-first), React + Tailwind + shadcn/ui. Databases: MongoDB by default, propose another one only when it fits the project better.
- Infra: Docker + Compose, self-hosted via Dokploy on a VPS (Traefik, Cloudflare DNS). Dokploy adds the Traefik labels when a domain is configured, so do not add basic Traefik labels to compose files.
- Secrets: Phase is the secret manager. Configuration goes through `.env` variables with minimal hardcoding. Never read, print or commit real `.env*` files; `.env.example` is fine.
- OS: Windows and macOS. Prefer cross-platform commands and Node scripts over shell-specific ones.
- IDEs: IntelliJ and PyCharm. Do not add editor-specific config files unless asked.
- Detect the toolchain from the project (`pyproject.toml`, `build.gradle.kts`, `package.json`, lockfiles) instead of assuming one.
- Stack detail lives in path-scoped rules (`~/.claude/rules/`) and loads only when matching files are touched.
- For security-critical changes (auth, secrets, exposed infra), spawn `security-reviewer` with `model: opus`; the default is sonnet.

## GitHub

- Use the `gh` CLI for all GitHub operations, no MCP.
- Keep outputs small: always filter with `--json` and `--jq`, e.g.
  gh pr list --json number,title,state --jq '.[] | "\(.number): \(.title)"'
- For endpoints without a dedicated command: use `gh api <endpoint>`.
- No `Co-Authored-By` or "Generated with" lines in commits or PRs.

# Session Naming (auto-rename)

## Expected behavior

1. **Early rename**: Once the session's main subject is clear (after 2-3 exchanges),
   run `/rename` with a short, descriptive title (max 50 chars)
2. **End-of-session update**: If scope shifted significantly, propose a re-rename before closing

## Title format

`[action] [subject]`. Examples:

- "fix whitepaper PDF build"
- "add auth middleware + tests"
- "refactor hook system"
- "update CC releases v2.2.0"

## Rules

- Max 50 characters, no "Session:" prefix, no date
- Action verb first (fix, add, refactor, update, research, debug...)
- Multi-topic: dominant subject only, not an exhaustive list
- Do NOT ask for confirmation on early rename (just do it)
