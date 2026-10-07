# Security Guidelines

Universal checks. Deep review (infra, MongoDB, Ktor, Discord, Phase) is the job of the `security-reviewer` agent.

## Before Any Commit

- [ ] No hardcoded secrets (API keys, passwords, tokens, connection strings with credentials)
- [ ] External input validated; no string-built queries (parameterized SQL, typed Mongo filters, no user-controlled operators like `$where` or `$ne` from raw JSON)
- [ ] Output encoded where HTML is produced (XSS)
- [ ] Authentication and authorization checked on every non-public endpoint; CSRF protection where cookie sessions are used
- [ ] Rate limiting on public and auth-related endpoints
- [ ] Error messages and logs do not leak sensitive data
- [ ] Dependencies are pinned or locked; no unreviewed new packages

## Secrets

- Secrets come from the environment (injected by Phase or Dokploy), never from source or committed `.env` files.
- Fail fast when a required secret is missing; never log secret values.
- Real `.env*` files, keys and credential files are never read, printed or committed. Only `.env.example` is allowed.

## If a Security Issue Is Found

1. Stop and tell the user what was found.
2. Use the **security-reviewer** agent for analysis.
3. Fix CRITICAL issues before continuing.
4. Rotate any exposed secret (a secret that reached git history counts as exposed).
5. Check the rest of the codebase for the same pattern.
