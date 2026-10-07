---
description: "Run coverage for the detected stack, find untested risky code paths and write meaningful tests for them."
argument-hint: "[path or module to focus on]"
---

# Test Coverage

Analyze test coverage and add tests where they matter. Scope: `$ARGUMENTS` if given, else the whole project.

1. Detect the stack and run tests with coverage:
   - **Python**: `uv run pytest --cov=<package> --cov-report=term-missing` (add `--cov-branch` if configured; needs `pytest-cov`)
   - **Kotlin**: Kover (`./gradlew koverHtmlReport` / `koverVerify`) or JaCoCo (`./gradlew test jacocoTestReport`), whichever is configured; `gradlew.bat` on Windows
   - **React/TS**: `npx vitest run --coverage` (package manager from the lockfile; needs `@vitest/coverage-v8`)
   - If no coverage tool is configured, say so and propose adding the minimal one rather than silently installing it.

2. Determine the target: use the project's configured threshold (`fail_under` in pyproject, Kover/JaCoCo rules, vitest `coverage.thresholds`). If none exists, do NOT impose a number; report current coverage and prioritize by risk.

3. Rank under-covered files by risk, not by percentage alone. High priority:
   - Auth, permissions, input validation, FastAPI request handlers and dependencies
   - Database access (Motor queries, indexes, upserts), data transformation, money/time logic
   - Error handling and retry paths, Discord command handlers and event listeners
   - Ktor routes and serialization, React hooks with state/effects
   Low priority: trivial getters, generated code, thin wrappers, config.

4. For each chosen file:
   - Read the uncovered lines (`term-missing`, HTML/lcov report) and understand the behavior
   - Write tests that assert behavior, not implementation: happy path, error handling, edge cases (empty, None/null, boundaries)
   - Use the project's existing fixtures and conventions (pytest fixtures, mongomock or a test database, Ktor `testApplication`, vitest + Testing Library); mock only external boundaries
   - Avoid tests that merely execute lines without meaningful assertions

5. Run the new tests, confirm they pass, and that they fail when the behavior is broken (mutate quickly if unsure).

6. Report before/after coverage for touched files, the risky paths still untested, and any threshold failures.
