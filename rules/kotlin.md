---
paths:
  - "**/*.kt"
  - "**/*.kts"
  - "**/gradle/libs.versions.toml"
---

# Kotlin (Ktor, Coroutines, Gradle Kotlin DSL, MongoDB coroutine driver)

Applies when Kotlin or Gradle files are touched.

## Language

- Prefer `val`, immutable collections and `data class` with `copy`. Model state with `sealed interface`/`sealed class` and exhaustive `when` (no `else` branch on sealed types so the compiler catches new cases).
- Null safety: avoid `!!`; use `?.`, `?:`, `requireNotNull`/`checkNotNull` with a message, or redesign so the value cannot be null. Do not expose platform types from Java APIs without a nullability decision.
- Use `Result`, sealed result types or domain exceptions for expected failures; reserve exceptions for exceptional cases. Never swallow `CancellationException`.
- Prefer extension functions and small top-level functions over utility classes. Use `@JvmInline value class` for typed IDs.
- Keep files focused; one public class per file unless closely related.

## Coroutines

- Structured concurrency: launch in a scope that has an owner (Ktor application scope, `coroutineScope`, `supervisorScope`). No `GlobalScope`.
- Never block a coroutine dispatcher: wrap blocking I/O in `withContext(Dispatchers.IO)`; inject dispatchers so tests can replace them.
- Rethrow `CancellationException`; when catching `Exception` in a suspend function, rethrow it first or catch narrower types.
- Use `async`/`awaitAll` for parallel independent work, `withTimeout` for network calls, `Flow` for streams (`flowOn` for context, `stateIn`/`shareIn` for sharing).

## Ktor

- Structure as `Application.module()` extension functions plus feature-based `Route.xxxRoutes()` extensions; configure plugins in one place (`ContentNegotiation` with kotlinx.serialization, `StatusPages`, `CallLogging`, `Authentication`, `CORS` with explicit hosts).
- Read configuration from `application.conf`/`application.yaml` with `${?ENV_VAR}` overrides so `.env`/Docker/Dokploy can configure without code changes.
- Validate request bodies explicitly (`RequestValidation` plugin or manual checks) and map failures in `StatusPages` to a consistent error body. Never return stack traces.
- Use `call.receive<T>()` with `@Serializable` DTOs separate from persistence models. Authentication via `authenticate("name") { ... }` blocks, JWT/session configured through plugins.
- Dependency injection: constructor injection by hand, or Koin if the project already uses it. Do not add a DI framework unprompted.
- Test with `testApplication { }`, use `client.config { install(ContentNegotiation) { json() } }`, override config with `environment { config = MapApplicationConfig(...) }`, and replace external services with fakes.

## MongoDB (official Kotlin coroutine driver)

- One `MongoClient` per application, created at startup, closed on `ApplicationStopped`; get collections with `database.getCollection<T>()`.
- Model documents as `@Serializable data class` (kotlinx.serialization via `bson-kotlinx`) with `@SerialName("_id")` and `ObjectId`/`BsonObjectId` handled explicitly. Use `Filters`, `Updates`, `Projections` builders, not hand-built strings.
- Collect flows with `toList()`/`firstOrNull()`; use `limit` and projections; create indexes at startup with `createIndex`.
- Never build filters from raw user input. See the `mongodb` rule.

## Gradle Kotlin DSL

- Use a version catalog (`gradle/libs.versions.toml`) and `libs.xxx` accessors; no hardcoded versions in `build.gradle.kts`. Keep the Gradle wrapper committed and up to date.
- Prefer `kotlin { jvmToolchain(21) }` (or the project's version). Use `plugins { }` block; avoid `buildscript` and `allprojects` unless needed.
- Multi-module: convention plugins in `build-logic` instead of copy-pasted config.
- Useful checks: `./gradlew build`, `./gradlew test`, `./gradlew check`, `./gradlew dependencies`; use `--info` or `--stacktrace` when debugging a failure. On Windows use `gradlew.bat`.
- Lint with ktlint or detekt only if the project configures it.

## Testing

- JUnit 5 or Kotest as the project uses; `kotlinx-coroutines-test` (`runTest`) for suspend code; MockK for mocking; Testcontainers for MongoDB integration tests.
- Test behavior through the HTTP layer with `testApplication` for routes and through repositories against a real (container) MongoDB for persistence.
