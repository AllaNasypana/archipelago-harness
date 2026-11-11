---
artifact_type: clarification
story: US-00-01-api
layer: api
version: 1
status: APPROVED
interview: done
updated_at: 2026-11-11T15:53:12Z
produced_by: story-clarifier
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 2 }
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md }
  - { path: docs/adr/ADR-001-web-testing.md }
  - { path: docs/adr/ADR-002-google-sign-in.md }
  - { path: docs/adr/ADR-003-react-compiler.md }
---

# US-00-01-api — Clarification

## Hypothesis

The story delivers the one Prisma access point for schema `app` and a Unit of Work that later
workflows (registration first, REG-03 / BR-001) use to commit writes of several modules in one
PostgreSQL transaction, before any business model or table exists.

## Questions

### Q1 [scope] — How AC-2/AC-3 are proven while no module tables exist

- **Status:** answered
- **Question:** No module, model or table exists yet (`prisma/schema.prisma`: "none exist yet").
  How do AC-2 and AC-3 get proven in this story?
- **Why it matters:** Decides whether this story adds production tables/migrations (scope, risk)
  or proves atomicity with test-only fixtures; it shapes the test plan.
- **Recommended:** Test-only proof: an integration test against the local database where two fake
  "module" adapters write to tables the test itself creates and drops; no production model or
  migration in this story. The first real two-module use is the registration workflow (REG-03).
- **Answer:** "Тестові фікстури (Recommended)"
- **Decision:** AC-2/AC-3 are proven by an integration test on the local database with two fake
  module adapters writing to test-created tables; no production model or migration here.

### Q2 [rules] — How a module receives the transaction

- **Status:** open
- **Question:** Do modules get the transaction explicitly (a transaction-scoped port/context passed
  into their repositories by the workflow) or implicitly (an async context the repositories read)?
- **Why it matters:** Sets the shape of every repository and `contracts/` port in later stories;
  hard to change after the first modules exist (AGENTS.md §3.6, §3.9).
- **Recommended:** Explicit: the Unit of Work runs a callback with a transaction context, and the
  workflow passes it to each module's port. Matches the story note ("modules receive a
  transaction-scoped port"), is visible in signatures and needs no extra library.
- **Answer:** "Явно (Recommended)"
- **Decision:** The Unit of Work runs a callback with an explicit transaction context; workflows
  pass it to each module's port. No async-context library.

### Q3 [concurrency] — Transaction policy: isolation, timeout, retries

- **Status:** open
- **Question:** Which isolation level and timeout does the Unit of Work use, and does it retry on
  serialization/deadlock failures?
- **Why it matters:** NFR-003 requires integrity under concurrency; the choice decides whether
  invariants rely on constraints and optimistic checks or on SERIALIZABLE plus retries.
- **Recommended:** PostgreSQL default READ COMMITTED, Prisma's default timeouts, no automatic
  retry. Invariants are enforced by unique constraints and version checks in the stories that own
  them (NFR-003: stale writes rejected, not retried silently).
- **Answer:** "READ COMMITTED, без повторів (Recommended)"
- **Decision:** READ COMMITTED, Prisma's default transaction timeouts, no automatic retry;
  concurrency invariants are enforced by constraints and version checks in the owning stories.

### Q4 [errors] — What "the error reaches the caller" means (AC-3)

- **Status:** open
- **Question:** After a rollback, is the original error rethrown unchanged, or wrapped in a Unit of
  Work error?
- **Why it matters:** Use cases map domain errors to responses; wrapping would hide them. The API
  error format itself has no ADR yet (AGENTS.md §5) and is not needed here (no endpoint).
- **Recommended:** Rethrow the original error unchanged after the rollback; no HTTP mapping in
  this story.
- **Answer:** "Оригінальну (Recommended)"
- **Decision:** After the rollback the Unit of Work rethrows the original error unchanged; no
  HTTP mapping in this story.

### Q5 [nfr] — Behavior when the database configuration is wrong at startup (AC-1)

- **Status:** open
- **Question:** If `DATABASE_URL` is missing, or points to another user or schema than
  `app_user` / `app`, should the API refuse to start?
- **Why it matters:** Makes AC-1 testable and keeps the schema boundary from failing silently
  (AGENTS.md §3.4); the message must not leak the password (§7).
- **Recommended:** Fail fast at startup with a clear message naming the problem, never the
  connection string or password.
- **Answer:** "Не стартує (Recommended)"
- **Decision:** The API refuses to start when `DATABASE_URL` is missing or not `app_user` /
  schema `app`, with a message naming the problem and never the URL or password.

### Q6 [data] — Credentials and schema ownership

- **Status:** answered-from-repo
- **Answer:** `infra/docker/initdb/01-schemas-and-roles.sh` creates `app_user` owning schema `app`
  (search_path `app`, CREATEDB for Prisma's shadow DB, no rights on `bff`);
  `apps/api/.env.example` uses `app_user` with `?schema=app`. Migrations run as `app_user`.
- **Decision:** The story uses this setup as is; no new role or grant.

### Q7 [dependencies] — Outbox in the same transaction

- **Status:** answered-from-repo
- **Answer:** REG-03 / BR-001 commit the outbox event in the same transaction as User, Workspace
  and Membership; the outbox itself is US-00-02-api.
- **Decision:** The Unit of Work must let any module's adapter (including the outbox) write through
  the same transaction; this story builds no outbox.

## Decisions

- C1 (Q1): Atomicity is proven with test-only fixtures (two fake module adapters, test-created
  tables) in an integration test; no production model or migration in this story.
- C2 (Q2): Transactions are passed explicitly: the Unit of Work runs a callback with a
  transaction context, and workflows hand it to each module's port; no async-context library.
- C3 (Q3): READ COMMITTED, Prisma's default timeouts, no automatic retry (NFR-003 is met by
  constraints and version checks in the stories that own the invariants).
- C4 (Q4): After a rollback the original error is rethrown unchanged.
- C5 (Q5): Fail fast at startup on a missing or wrong database configuration (user other than
  `app_user`, schema other than `app`); the message never contains the URL or password.

## Assumptions

- None.

## Out of scope

- Business models, tables and migrations (first ones arrive with US-01-01-api / US-01-03-api).
- The outbox (US-00-02-api) and HTTP endpoints.
- Configurable isolation levels and automatic retries (C3).

## Needs an ADR

- None for this story. API error format and ID strategy are still undecided project-wide
  (AGENTS.md §5); they are not needed here but will be before US-01-01-api / US-01-03-api.

## Spec checklist

- Database access point: one Prisma client for schema `app` in `infrastructure/database`, its
  NestJS lifecycle (connect on start, disconnect on shutdown), and how modules get it only through
  ports (AGENTS.md §3.6).
- Startup configuration check (C5): which values are checked (`DATABASE_URL` present, user
  `app_user`, schema `app`), the failure message, and that no URL or password is logged.
- Unit of Work contract (C2): the callback signature, the transaction context type modules
  receive, and how a module port uses it; no Prisma-generated type leaks into `contracts/`.
- Transaction policy (C3): READ COMMITTED, Prisma default timeouts, no retry.
- Rollback and error propagation (C4): any thrown error rolls back every write and is rethrown
  unchanged.
- Test fixtures (C1): integration test on the local database with two fake module adapters and
  test-created tables; how the tables are created and dropped without a production migration.
- Prisma config: `apps/api/prisma7.config.ts` is not the CLI's default config file name; the spec
  states which config file the CLI and the app use.

## Story changes

Applied to story.md v2 on the human's confirmation ("так", 2026-11-11):

- AC-1 changed to: Given `DATABASE_URL` for `app_user` and schema `app`, when the API starts, then
  it connects through the single database access point using only those credentials and that
  schema. _(§6.1, AGENTS.md §3.4)_
- AC-2 unchanged; add "(proven with two test module adapters, C1)" to its reference.
- AC-3 changed to: Given a write in the Unit of Work fails, then every earlier write in it is
  rolled back and the original error reaches the caller unchanged. _(REG-AC-10, C4)_
- AC-4 added: Given `DATABASE_URL` is missing or names another user or schema, when the API
  starts, then it refuses to start with a message that names the problem and contains no
  connection string or password. _(AGENTS.md §3.4, §7, C5)_
- Notes: add "explicit transaction context (C2); READ COMMITTED, no retry (C3); no production
  model or migration in this story (C1)".
