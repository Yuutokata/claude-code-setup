---
description: "Generate, run and report Playwright end-to-end tests for the React frontend via the e2e-runner agent."
argument-hint: "[user flow to test, or path to a spec]"
---

# E2E Command

Invokes the **e2e-runner** agent (`~/.claude/agents/e2e-runner.md`) to generate, maintain and run Playwright tests for the React frontend. Pass it `$ARGUMENTS` (the flow or spec) and let it own the details: Page Object Model, selectors, flaky-test quarantine, artifacts, CI wiring.

## Run essentials

1. Detect setup: `playwright.config.ts`, `@playwright/test` in `package.json`, package manager from the lockfile. If missing, propose `npm init playwright@latest` (or the pnpm/yarn equivalent) and confirm first.
2. Make sure the app under test is running (the config's `webServer`, vite dev server, or `docker compose up`). Backend (FastAPI/Ktor) should use a test database, never production.
3. Run:

```bash
npx playwright test                       # all
npx playwright test tests/e2e/<file>.spec.ts
npx playwright test --headed              # watch the browser
npx playwright test --debug
npx playwright show-report                # HTML report
npx playwright show-trace <trace.zip>
```

4. On failure, inspect the screenshot/trace before changing code; fix selectors/waits (wait for responses or `expect` conditions, not fixed timeouts), not assertions. Quarantine confirmed flaky tests with `test.fixme()` and report them.

## Rules

- Prefer `getByRole` / `data-testid` selectors; no CSS-class selectors.
- Cover critical journeys only (login, core CRUD, payments if any); push edge cases to unit tests (vitest).
- Never run against production; use test accounts and test data.

## Report

Total / passed / failed / flaky, duration, paths to the HTML report and any failure artifacts, plus recommended follow-ups.
