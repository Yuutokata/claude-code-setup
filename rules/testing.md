# Testing

## Principles

- Test behavior, not implementation. Prefer a few meaningful tests over many brittle ones.
- Test types by need: unit tests for logic, integration tests for API endpoints and database access, E2E only for critical user flows.
- Use real dependencies for integration tests where cheap (Testcontainers / a disposable MongoDB, Ktor `testApplication`, FastAPI `TestClient`/`httpx.AsyncClient`) and fake only external services.
- Tests must be isolated and deterministic: no shared state, no real network, no wall-clock dependence.

## Test-First Where It Pays Off

- For new logic and bug fixes, write a failing test first, make it pass with the minimal change, then refactor. The `tdd-guide` agent and the `tdd` skill help with this.
- For a bug fix, the failing test reproduces the bug before the fix.
- Skip test-first for throwaway scripts, pure config and trivial glue.

## Coverage

- Measure coverage only when the project has the tooling (pytest-cov, Kover/JaCoCo, vitest). Use the project's own threshold if it has one; do not invent a fixed percentage.
- Coverage is a hint for untested risk, not a goal.

## Failing Tests

1. Read the failure first; check isolation and mocks.
2. Fix the implementation, not the test, unless the test itself is wrong.
3. Never delete or skip a test just to get green; say so if one must be quarantined.
