---
artifact_type: specification
story: US-00-01-api
layer: api
version: 2
status: APPROVED
risk: high
updated_at: 2026-11-11T17:27:28Z
produced_by: spec-writer
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/clarification.md, version: 1 }
  - { path: docs/stories/epic-01/decisions.md, version: 2 }
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md }
---

# US-00-01-api — Database access and Unit of Work

## Summary

`apps/api` gets one database access point for schema `app` and a Unit of Work that runs a
callback in one PostgreSQL transaction, so a workflow can commit the writes of several modules
together or not at all (REG-03, BR-001). The API refuses to start with a wrong database
configuration. No business model, table or endpoint is added.

## Acceptance criteria

- **AC-1** Given `DATABASE_URL` names user `app_user` and schema `app`, when the API starts, then
  it connects through the single database access point, which itself sets schema `app` for every
  connection instead of relying on the role's default `search_path`, and every query of that
  connection runs as `app_user` in schema `app`. _(§6.1, AGENTS.md §3.4, story AC-1, human
  comment at HUMAN_SPEC_APPROVAL v1)_
- **AC-2** Given a callback run by the Unit of Work that writes through two different module
  adapters, when the callback completes, then both writes are committed and visible to a new
  connection. _(REG-03, BR-001, story AC-2, C1, C2)_
- **AC-3** Given a callback run by the Unit of Work in which a write succeeds and a later step
  throws, when the Unit of Work finishes, then the earlier write is not visible to a new
  connection and the caller receives the same error object that was thrown. _(REG-AC-10, story
  AC-3, C4)_
- **AC-4** Given `DATABASE_URL` is missing, unparsable, or names a user other than `app_user` or a
  schema other than `app`, when the API starts, then startup fails with a message naming which
  check failed, and the message contains neither the URL nor the password. _(AGENTS.md §3.4, §7,
  story AC-4, C5)_

## Out of scope

- Business models, tables and Prisma migrations (C1); the first ones come with US-01-01-api /
  US-01-03-api.
- The outbox (US-00-02-api), HTTP endpoints and an API error format.
- Configurable isolation levels, automatic retries, nested Units of Work (C3).

## Design — api

### Endpoints, DTOs, errors, authorization

None. The story adds no HTTP surface, so no DTO, OpenAPI change, error format or authorization
rule. The `packages/api-client` is not regenerated.

### Components (`src/infrastructure/database/`)

| Component              | Responsibility                                                                                                                                                                                                                                                            |
| ---------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Database configuration | Reads `DATABASE_URL` once at startup and validates it (AC-4): present, parsable, user `app_user`, schema `app` (from the `schema` query parameter). Throws with the failed check's name only.                                                                             |
| Database access point  | The only Prisma client of the API, built with the PostgreSQL driver adapter (`@prisma/adapter-pg`, already a dependency). Sets schema `app` explicitly (see Schema `app`). Connects when the Nest application starts, disconnects on shutdown. Never exported to modules. |
| Unit of Work           | `run(work)` executes `work(tx)` inside one interactive transaction and returns its result; commits when `work` resolves, rolls back and rethrows the original error when it rejects (AC-2, AC-3).                                                                         |
| Transaction context    | The value `tx` passed to `work`. Opaque to `application/` and `domain/` code; only `infrastructure/` adapters turn it into the transactional Prisma client for their own tables.                                                                                          |

### Schema `app` (AC-1)

The access point does not rely on the `schema` query parameter (the adapter ignores it) or on
`app_user`'s role default `search_path`. It applies the validated schema itself, in two places:

- the adapter's `schema` option, so queries Prisma generates for models are qualified with `app`;
- the session `search_path` of every pooled connection, set to exactly `app` when the connection
  opens, so raw queries and unqualified names resolve in `app` too.

Both values come from the validated configuration (AC-4), never from a second hard-coded string.

### Unit of Work contract (C2)

- Explicit, not implicit: a workflow calls `run(work)` and passes `tx` to each module port it
  calls. There is no async-context lookup.
- The port signature that application code depends on, and the opaque `TransactionContext` type,
  contain no Prisma-generated type (AGENTS.md §3.6, `contracts/` rule in `apps/api/AGENTS.md`).
  Their location must keep `domain/` free of Prisma and NestJS (§3.8); the plan picks it.
- The Unit of Work is provided by a NestJS module that application code imports to obtain it;
  modules never receive the Prisma client itself.
- `run` inside another `run` is not supported in this story; callers pass the outer `tx` instead.

### Transaction policy (C3)

- Isolation: READ COMMITTED (PostgreSQL default), set explicitly so it does not depend on
  database defaults.
- Timeouts: Prisma's defaults for interactive transactions.
- No automatic retry. Invariants under concurrency (NFR-003) are enforced by constraints and
  version checks in the stories that own them.

### Errors (C4)

- Any error thrown inside `work` rolls back every write of that transaction and is rethrown as the
  same object: no wrapping, no logging inside the Unit of Work.
- A startup configuration failure (AC-4) aborts the application bootstrap.

### Domain rules

None. BR-001 atomicity is applied by the registration workflow (US-01-03-api) using this Unit of
Work.

### Persistence

- No model and no migration (C1). `prisma/schema.prisma` keeps only the generator and datasource.
- Credentials and schema come from `infra/docker/initdb/01-schemas-and-roles.sh`: `app_user` owns
  schema `app` and has no rights on `bff` (Q6).
- Prisma config: `apps/api/prisma7.config.ts` is not a file name the Prisma CLI loads by default.
  The CLI and the app must use one config file; the plan states which and how.

### Side effects

None; outbox writes will use the same `tx` (US-00-02-api, Q7).

### Tests (C1)

- AC-2, AC-3: integration tests against the local database (`pnpm db:up`). The test creates two
  tables, writes through two fake "module" adapters inside `run`, checks visibility from a
  separate connection, and drops the tables afterwards. No production migration.
- AC-1, explicit schema: unit test that the access point builds the adapter with `schema: 'app'`
  and a connection-level `search_path` of `app`, both taken from the validated configuration. This
  is the test that fails if the schema is left to the role default.
- AC-1, effect: integration test that a connection of the access point reports `current_user`
  `app_user`, `current_schema()` `app` and `search_path` exactly `app`. On its own it cannot tell
  the explicit setting from the role default, hence the unit test above.
- AC-4: unit tests over the configuration validation, one case per failed check, asserting the
  message names the check and does not contain the URL or password.

### Security

- `DATABASE_URL` and the password never appear in logs or error messages (AGENTS.md §7,
  NFR-004).
- No access to schema `bff`; nothing grants it.

## Open points

- `pnpm test` runs every `*.spec.ts`; integration tests need the database. The plan decides how
  they are separated (file pattern or config) so unit runs do not require `pnpm db:up`.
- The existing e2e test boots `AppModule`; once the database module is imported it needs a valid
  `DATABASE_URL` and a running database. The plan covers this impact.
- AC-4 hard-codes `app_user` / `app` per C5. A production role with another name would need a
  configuration change later; noted, not decided here.
- Review findings F1, F3, F4, F5 of spec-review v1 are left to PLANNING as the human decided
  (rejection comment named only F2).

## Revisions

- v2: schema `app` set explicitly by the access point (F2 of spec-review v1; human comment
  "врахуй F2: явно задати схему app"). AC-1, the access point row, a new "Schema `app`" section
  and the AC-1 tests changed; nothing else.
