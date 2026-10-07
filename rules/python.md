---
paths:
  - "**/*.py"
  - "**/pyproject.toml"
---

# Python (FastAPI, Motor/PyMongo, discord.py)

Applies when Python files are touched. Detect the toolchain first (`uv.lock`, `poetry.lock`, `requirements*.txt`) and use what the project uses.

## Async

- The codebase is async-first. Never call blocking code (`requests`, `time.sleep`, sync PyMongo, file or CPU-heavy work) inside `async def`. Use `httpx.AsyncClient`, `asyncio.sleep`, `asyncio.to_thread` or a process pool.
- Create clients (Mongo, HTTP) once at startup via FastAPI `lifespan` or the bot's `setup_hook`, and close them on shutdown. Never create a client per request.
- Run independent awaits concurrently with `asyncio.gather` or `asyncio.TaskGroup`; keep references to background tasks so they are not garbage collected; handle `asyncio.CancelledError` by cleaning up and re-raising.
- Put timeouts on every network call (`asyncio.timeout`, driver `serverSelectionTimeoutMS`, httpx `timeout`).

## FastAPI

- Structure by feature: `router`, `schemas` (Pydantic), `service`, `repository`. Routers stay thin and delegate to services.
- Use Pydantic v2 models for request and response; set `response_model` so internal fields (password hashes, `_id` internals) never leak. Validate with `Field` constraints, not manual checks.
- Dependencies via `Depends` (settings, DB, current user); override them in tests with `app.dependency_overrides`.
- Settings with `pydantic-settings` (`BaseSettings`, `.env` locally, real environment in Docker/Dokploy). No `os.environ[...]` scattered through the code.
- Raise `HTTPException` or domain exceptions mapped by exception handlers; return consistent error bodies; do not expose stack traces.
- Authentication and authorization are dependencies, not per-endpoint copy-paste. Configure CORS with explicit origins.

## Motor / PyMongo

- Motor is async; if the project uses PyMongo's native async API, follow that instead of mixing both.
- Convert `ObjectId` at the boundary (Pydantic `field_validator` / `PydanticObjectId` type); never return raw `ObjectId` or BSON types.
- Project only needed fields, add indexes for every query pattern, use `create_index` at startup (idempotent), and use `update_one` with `$set`/`$inc` instead of read-modify-write.
- Never build filters from raw user JSON. Whitelist fields and operators (NoSQL injection via `$ne`, `$where`, `$regex`). See the `mongodb` rule.

## discord.py

- Declare the minimum `Intents`; enable privileged intents only when needed.
- Structure with Cogs and `app_commands`; `await interaction.response.defer()` before slow work; handle rate limits and `discord.HTTPException`.
- The bot token comes from the environment, never from the repo or logs.
- Do not block the event loop in commands or listeners.

## Typing and Style

- Full type hints on public functions; `from __future__ import annotations` where useful; prefer `X | None` over `Optional[X]`.
- Models: `dataclass(frozen=True)`, `NamedTuple` or Pydantic; avoid passing bare dicts across layers.
- Lint and format with `ruff` (`ruff check`, `ruff format`), type-check with `mypy` or `pyright` if configured. Follow the project's config rather than adding new tools.
- Use `logging` (structured, no `print`), f-strings, `pathlib`, context managers for resources.
- Catch specific exceptions; no bare `except:`; use `raise ... from err` to keep context.

## Testing

- `pytest` with `pytest-asyncio` (or `anyio`) for async tests; `httpx.AsyncClient(transport=ASGITransport(app=app))` for FastAPI.
- Use a disposable MongoDB (Testcontainers or a compose service) for integration tests; mock only external HTTP and Discord.
- Fixtures for app, DB and cleanup; no shared state between tests; freeze time instead of sleeping.
