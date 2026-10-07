---
description: "Find and remove dead code and unused dependencies per stack, running tests before and after each batch of deletions."
argument-hint: "[path or scope]"
disable-model-invocation: true
---

# Refactor Clean

Safely identify and remove dead code with test verification. Delegate the analysis and removal to the **refactor-cleaner** agent, passing the detected stack and `$ARGUMENTS` as scope.

1. Establish a baseline: run the test suite (and build) first. If it is already red, stop and report.

2. Detect tools per stack (use what is configured or already installed; do not install globally without asking):
   - **Python**: `ruff check --select F401,F841,F811 .` (unused imports/variables/redefinitions), `vulture <package>` if available, unused deps via `deptry` if configured
   - **Kotlin**: compiler warnings (`./gradlew build --warning-mode all`), `detekt` rules for unused code/imports if configured
   - **React/TS**: `npx knip` (unused files/exports/deps), `npx depcheck`, `tsc --noUnusedLocals --noUnusedParameters --noEmit`
   - **Docker/Compose**: unused services, volumes, stale build args (manual review)

3. Write the findings to `.reports/dead-code-analysis.md` (create the directory if missing; do not commit it) and categorize:
   - SAFE: unused imports/variables, unused private helpers, unused test utilities
   - CAUTION: exported functions, API routes, components, anything used by reflection, FastAPI dependency injection, Ktor module wiring, Discord cog/event registration, dynamic imports
   - DANGER: config files, entry points, migrations, public API surface

   Tools produce false positives for decorator/DI/reflection-based code; verify with grep before deleting.

4. Propose SAFE deletions first and get the user's go-ahead for CAUTION items. Never touch DANGER without explicit approval.

5. Work in small batches. For each batch: apply the change, run build + tests, and revert that batch if anything fails.

6. Summary: items removed, items skipped (with reason), test results before and after.

Never delete code without a passing test run before and after.
