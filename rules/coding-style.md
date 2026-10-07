# Coding Style

Language-neutral baseline. Language-specific detail lives in path-scoped rules (python, kotlin, frontend, docker, mongodb).

## Data and State

- Prefer immutable data and returning new values over mutating inputs (frozen dataclasses / Pydantic models, Kotlin `val` and `data class` with `copy`, spread in TS). Mutate only where idiom or performance clearly calls for it (builders, hot loops, driver documents being built).
- Keep state local. Shared mutable state needs an explicit owner and a reason.

## File and Function Organization

- Many small, focused files over few large ones: 200-400 lines typical, 800 max.
- High cohesion, low coupling. Organize by feature/domain, not by technical type.
- Functions do one thing and stay small (aim for <50 lines). Avoid nesting deeper than 4 levels; use early returns.
- Extract utilities when a file mixes concerns, not preemptively.

## Errors

- Handle errors at the right boundary and never swallow them silently.
- Add context when rethrowing; do not leak internals, stack traces or secrets to API clients.
- Log with the project's logger, not `print` / `println` / `console.log`.
- Async code: propagate cancellation, never block the event loop or the coroutine dispatcher.

## Input and Configuration

- Validate all external input at the boundary (Pydantic, Ktor request validation, zod). Trust nothing from requests, webhooks, Discord events or the database.
- No hardcoded secrets, URLs, ports or credentials. Read configuration from environment variables with typed settings, and fail fast with a clear message when a required one is missing.
- Provide a `.env.example` listing every variable, without real values.

## Before Marking Work Complete

- Code is readable and well named; comments explain why, not what.
- Linter, formatter and type checker of the project pass.
- Relevant tests pass; new behavior has a test where a test is worthwhile.
- No leftover debug output, dead code or TODOs without a reason.
