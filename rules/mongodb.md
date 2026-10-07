---
paths:
  - "**/mongo*.{py,kt,js,ts,yml,yaml,conf,json}"
  - "**/*{Mongo,mongo,Repository,repository,Dao,dao}*.{py,kt,ts,js}"
  - "**/{db,database,repositories,repository,persistence,dao,models}/**/*.{py,kt,ts,js}"
  - "**/*.mongodb.js"
  - "**/init-mongo*"
---

# MongoDB

Database-agnostic note: MongoDB is the default. If the data is strongly relational (many joins, multi-row transactions, reporting), say so and propose PostgreSQL instead of forcing documents.

## Schema Design

- Model for the access pattern: embed data that is read together and bounded in size; reference data that grows without bound, is shared, or changes independently.
- Documents must stay well below the 16 MB limit; avoid unbounded arrays (use a bucket or separate collection).
- One collection per aggregate. Use consistent field names and types; store dates as BSON dates (UTC), money as integer minor units or Decimal128, IDs as `ObjectId` or explicit UUID type, never as strings of mixed type.
- Add `createdAt`/`updatedAt`; version documents (`schemaVersion`) when the shape will evolve. Optionally enforce shape with `$jsonSchema` validators.

## Indexes and Queries

- Every query pattern has an index. Follow ESR (Equality, Sort, Range) for compound index field order. Check with `explain("executionStats")`: avoid `COLLSCAN` and large `docsExamined/nReturned` ratios.
- Use unique indexes for natural keys, TTL indexes for expiring data, partial indexes to keep them small. Index creation belongs in startup or migration code and must be idempotent.
- Always project only the fields needed; always `limit` list queries; paginate with a range on an indexed field instead of large `skip`.
- Prefer atomic update operators (`$set`, `$inc`, `$push`, `$addToSet`, `findOneAndUpdate`, `upsert`) over read-modify-write. Use transactions only when multiple documents must change atomically (needs a replica set).
- Aggregation: filter (`$match`) and reduce (`$project`) as early as possible; avoid `$lookup` on large unindexed collections.

## Security

- Never pass user-controlled JSON as a filter. Whitelist fields, force expected types (a string, not `{"$ne": null}`), and never allow user input into `$where`, `$function`, `$accumulator` or `$regex` without escaping and limits (ReDoS).
- Enable authentication (`--auth`/`MONGO_INITDB_ROOT_USERNAME`), create per-application users with least-privilege roles on one database; do not use the root user in the app.
- Never expose port 27017 to the internet. In Docker Compose, do not publish the port (use an internal network); if remote access is unavoidable, bind to localhost and use a tunnel or firewall rule. Use TLS for any remote connection.
- Connection strings and passwords come from the environment (Phase / Dokploy), never from the repo, and are never logged. Rotate credentials that leaked.
- Backups (`mongodump` or volume snapshots) must be tested by restoring; keep them off the same disk.

## Operations

- Set `serverSelectionTimeoutMS`, `maxPoolSize` and `retryWrites`; reuse a single client per process.
- Use a named volume for `/data/db`; never run destructive commands (`dropDatabase`, `deleteMany({})`) without explicit user confirmation.
- Local development: a Compose service with a healthcheck (`mongosh --eval "db.adminCommand('ping')"`), and `depends_on: condition: service_healthy` for dependent services.
