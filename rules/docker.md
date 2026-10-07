---
paths:
  - "**/Dockerfile*"
  - "**/*.dockerfile"
  - "**/{docker-,}compose*.{yml,yaml}"
  - "**/.dockerignore"
---

# Docker, Compose and Dokploy

## Dockerfile

- Pin base image tags (`python:3.12-slim`, `eclipse-temurin:21-jre`, `node:22-alpine`), never `latest`; consider digests for production.
- Multi-stage builds: build in one stage (Gradle/JDK, `uv`/pip, `npm ci`), copy only the artifact into a slim runtime stage.
- Order layers for caching: copy dependency manifests first (`pyproject.toml`/`uv.lock`, `build.gradle.kts`/`libs.versions.toml`, `package*.json`), install, then copy sources.
- Run as a non-root user (`USER`), set `WORKDIR`, use `COPY` instead of `ADD`, combine and clean package-manager steps (`--no-install-recommends`, `rm -rf /var/lib/apt/lists/*`, `pip --no-cache-dir`).
- Keep a `.dockerignore` (`.git`, `.env*`, `node_modules`, `build`, `.venv`, `__pycache__`). Never `COPY` secrets or `.env` into an image and never pass secrets via `ARG`/`ENV` in the Dockerfile; they end up in image layers.
- Use exec-form `CMD ["..."]` so signals reach the process (graceful shutdown). JVM: container-aware flags such as `-XX:MaxRAMPercentage=75`.
- Add a `HEALTHCHECK` or define it in Compose.

## Compose

- Do not use the obsolete top-level `version:` key. Name services and networks explicitly.
- Configuration through `environment:`/`env_file:` with `${VAR:-default}` interpolation; commit a `.env.example`, never the real `.env`. Secrets come from Phase/Dokploy environment, not from files in the repo.
- Databases and internal services: no `ports:` mapping (reach them over the Compose network); publish only what must be public. If a port must be published for local development, bind to loopback: `"127.0.0.1:27017:27017"`.
- Persist data with named volumes; document what is deleted by `down -v`.
- `healthcheck:` plus `depends_on: condition: service_healthy` for startup order; `restart: unless-stopped` for services.
- Set resource limits (`mem_limit`, `cpus` or `deploy.resources`) for production services; `read_only: true`, `cap_drop: [ALL]` and `security_opt: [no-new-privileges:true]` where the app allows it. Avoid `privileged: true` and mounting `/var/run/docker.sock`.
- Use `docker compose config` to validate and view the merged result.

## Dokploy and Traefik

- Dokploy adds the Traefik labels when you configure a domain in the Domains tab. Do not add basic Traefik router/service/TLS labels to compose files and do not publish ports just for routing.
- Give services that Traefik must reach the external `dokploy-network`, only if the Dokploy docs for the deployment type require it; keep databases on a private network.
- Domains, DNS (Cloudflare) and TLS are configured in Dokploy/Cloudflare, not in the repo. With Cloudflare proxying, use the Full (strict) SSL mode.
- Environment variables and secrets are set in the Dokploy service environment (sourced from Phase), not baked into images or committed compose files.
- Prefer deploying from a Git repo with a Dockerfile or compose file so deployments are reproducible.
