---
description: "Sync README and docs with the project's sources of truth (scripts, tasks, env vars, compose files, OpenAPI) and verify documented commands exist."
argument-hint: "[readme|env|scripts|all]"
disable-model-invocation: true
---

# Update Documentation

Sync documentation from the source of truth. Scope from `$ARGUMENTS` (default `all`). For larger doc work, the **doc-updater** agent can do the writing.

1. Collect sources of truth for the detected stack:
   - **Python**: `pyproject.toml` (`[project.scripts]`, dependency groups, tool config for ruff/mypy/pytest), `uv.lock` presence; for FastAPI, export the schema (`app.openapi()` or `/openapi.json` from a locally running app) and list routes
   - **Kotlin**: `build.gradle.kts` tasks (`./gradlew tasks`), `application.conf` / `application.yaml` keys, version catalog
   - **React/TS**: `package.json` scripts and engines, `vite.config.*` env usage (`VITE_*`)
   - **Env vars**: `.env.example` (read ONLY the example file; never read `.env` or other secret files)
   - **Docker**: `docker-compose*.yml` / `compose*.yml` services, ports, volumes, profiles, `Dockerfile` targets and exposed ports

2. Generate or refresh the relevant README sections in place, preserving hand-written prose:
   - Prerequisites and setup (uv / Gradle wrapper / package manager from the lockfile; Windows and macOS notes where commands differ, e.g. `gradlew.bat`)
   - Scripts/tasks reference table (command, purpose)
   - Environment variable table: name, purpose, required/optional, example value (placeholders only, never real values)
   - Docker/Compose usage and ports
   - API overview from OpenAPI when applicable
   - Testing and lint commands

3. Verify every documented command exists: each npm script in `package.json`, each Gradle task in `./gradlew tasks --all`, each `[project.scripts]` entry or `uv run` target, each compose service name. Remove or fix stale ones.

4. If the project already has `docs/CONTRIB.md` or `docs/RUNBOOK.md`, refresh them (development workflow, deployment, common issues, rollback). Do not create new doc files unless asked.

5. List docs not modified in 90+ days (`git log -1 --format=%cs -- <file>`) for manual review.

6. Show a diff summary of what changed.
