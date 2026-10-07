---
description: "Run build, type, lint, test, secrets and git checks for the detected stack (Python, Kotlin, React/TS, Docker) and report PASS/FAIL."
argument-hint: "[quick|full|pre-commit|pre-pr]"
---

# Verification Command

Run verification on the current codebase state. Mode comes from `$ARGUMENTS` (default `full`).

## Stack detection

Detect from files in the project root (monorepos: check each subproject directory):

| Marker | Build / types | Lint / format | Tests |
|--------|---------------|---------------|-------|
| `pyproject.toml` / `uv.lock` | `uv run mypy .` or `pyright` (only if configured) | `uv run ruff check .` and `uv run ruff format --check .` | `uv run pytest` |
| `build.gradle.kts` | `./gradlew build -x test` (`gradlew.bat` on Windows) | `ktlintCheck` / `detekt` if the tasks exist (`./gradlew tasks --all`) | `./gradlew test` |
| `package.json` | `typecheck` script, else `npx tsc --noEmit`; then `build` script | `lint` script (eslint) | `test` script (vitest, run once, not watch) |
| `compose*.y*ml` / `docker-compose*.y*ml` | `docker compose config -q` | n/a | n/a |

- Use the package manager matching the lockfile (`pnpm-lock.yaml`, `yarn.lock`, `bun.lockb`, else npm).
- Without `uv`, fall back to `python -m ruff` / `python -m pytest` inside the active venv.
- Skip a check that the project does not configure and say so in the report; never invent tooling.

## Steps (in order)

1. **Build**: compile/build. If it fails, report errors and STOP (suggest `/build-fix`).
2. **Types**: mypy/pyright, Kotlin compile, `tsc`. Report errors as file:line.
3. **Lint**: ruff, ktlint/detekt, eslint. Report warnings and errors.
4. **Tests**: run the full suite. Report passed/failed counts, plus coverage only if already configured.
5. **Secrets scan**: grep the diff (`git diff HEAD` plus untracked files) for key patterns such as `AKIA[0-9A-Z]{16}`, `sk-[A-Za-z0-9]{20,}`, `ghp_[A-Za-z0-9]{30,}`, `xox[bp]-`, `-----BEGIN .*PRIVATE KEY-----`, `mongodb(\+srv)?://[^/\s:]+:[^@\s]+@`, `(password|secret|token|api[_-]?key)\s*[:=]\s*['"][^'"]{8,}`. Report file:line and pattern name ONLY, never print the matched value. Do not open `.env` files; confirm they are git-ignored with `git check-ignore`.
6. **Git status**: `git status --short` and a diff stat.

## Modes

- `quick`: steps 1-2 only.
- `full` (default): steps 1-6.
- `pre-commit`: steps 2-3, tests related to changed files if the runner supports it (otherwise full), secrets scan, git status.
- `pre-pr`: full plus a closer secrets/security look at the diff (auth, input handling, Docker/compose, CI config) and a check that the branch is rebased on the base branch.

Optional, frontend only: flag leftover `console.log` / `debugger` in changed `.ts/.tsx` files as a warning, never as a failure.

## Output

```
VERIFICATION: [PASS/FAIL]   mode: <mode>   stacks: <detected>

Build:    [OK/FAIL/SKIPPED]
Types:    [OK/X errors/SKIPPED]
Lint:     [OK/X issues/SKIPPED]
Tests:    [X/Y passed]
Secrets:  [OK/X findings (file:line, pattern)]
Git:      [clean / N files changed]

Ready for PR: [YES/NO]
```

List any failures with concrete fix suggestions.
