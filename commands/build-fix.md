---
description: "Detect the failing build or type check in Python, Kotlin, React/TS or Docker and fix errors one at a time until it passes."
argument-hint: "[optional build command or subproject path]"
---

# Build and Fix

Fix build errors step by step. For large or cross-file failures, delegate to the **build-error-resolver** agent (minimal fixes, no architectural changes).

1. Detect the build system before running anything (use `$ARGUMENTS` if it names a command or path):
   - `pyproject.toml` / `uv.lock`: `uv run ruff check .`, `uv run mypy .` (if configured), `uv run pytest --collect-only -q` (surfaces import errors)
   - `build.gradle.kts`: `./gradlew build -x test` (`gradlew.bat` on Windows)
   - `package.json`: `typecheck` script or `npx tsc --noEmit`, then the `build` script (package manager from the lockfile)
   - `Dockerfile` / compose files: `docker compose build` (and `docker compose config` for YAML errors)
   - Otherwise a `Makefile` or other detected tool. Run from the project root.

2. Parse the error output: group by file, fix root causes first (an import or type error often cascades).

3. Per-stack hints:
   - **Python**: ruff errors (unused or missing imports, undefined names), mypy type errors (missing annotations, Optional handling, Motor/FastAPI typing stubs), pytest collection/import errors (wrong package path, missing dependency in `pyproject.toml`; add with `uv add`).
   - **Kotlin/Gradle**: compile errors (nullability, missing imports, Ktor API changes), dependency resolution failures (check version catalog / `build.gradle.kts`), Kotlin/JDK toolchain mismatch.
   - **TypeScript**: tsc errors (strict null checks, missing types, `any` leaks), vite build failures (alias or env var issues), missing dependency in `package.json`.
   - **Docker**: wrong base image/tag, failing `COPY` paths (check `.dockerignore`), missing build args, lockfile out of sync with install step.

4. For each error:
   - Show the context (5 lines before/after)
   - Explain the root cause
   - Apply the minimal fix
   - Re-run the same command and confirm the error is gone

5. Stop if:
   - The fix introduces new errors
   - The same error persists after 3 attempts
   - The user requests a pause
   - The fix would need a design change (report it instead)

6. Summary: errors fixed, errors remaining, new errors introduced.

Fix one error at a time. Never suppress errors with `# type: ignore`, `@Suppress`, `@ts-ignore` or lint disables unless the user agrees.
