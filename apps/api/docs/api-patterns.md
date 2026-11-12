# API patterns — `apps/api`

How recurring problems are solved in `apps/api`. Read together with [`AGENTS.md`](../AGENTS.md);
root [`AGENTS.md`](../../../AGENTS.md) wins on conflict. Implementation and review of `api`
stories check code against this document. A pattern lands here when a story settles it; the story
artifacts that settled it are not kept.

## 1. Unit of Work and transactions

Settled in US-00-01-api. Code: `src/common/unit-of-work.ts` (port),
`src/infrastructure/database/` (Prisma implementation).

- `UnitOfWork.run(work)` runs `work(tx)` in one PostgreSQL transaction: commit when it resolves,
  rollback and **rethrow the original error unchanged** when it rejects. No catch, wrap or log
  inside the Unit of Work.
- The transaction is passed **explicitly**: a workflow (or a use case) calls `run`, and hands the
  opaque `TransactionContext` to each module port it calls. No async-context library.
- Only infrastructure adapters open it: `prismaClientOf(tx)` returns the Prisma transaction client
  and throws on a context it did not create. Application and domain code never see Prisma.
- `UnitOfWork` and `TransactionContext` live in `src/common/` (technical, no Prisma or NestJS
  import); `DatabaseModule` exports only `UnitOfWork`.
- Isolation `READ COMMITTED`, Prisma's default timeouts, **no automatic retry**. Invariants under
  concurrency are enforced by database constraints (unique index, FK) and version checks in the
  story that owns the invariant (NFR-003), not by a stricter isolation level.

```ts
// Illustrative: workflows/registration — one Unit of Work across modules (AGENTS.md §3.9)
await this.unitOfWork.run(async (tx) => {
  const user = await this.identity.createUser(command, tx);
  await this.workspaces.createPersonalWorkspace(user.id, tx);
  await this.outbox.enqueue(userRegistered(user.id), tx);
});

// identity/infrastructure — the adapter opens the context
async createUser(command: CreateUser, tx: TransactionContext) {
  return prismaClientOf(tx).user.create({ data: toRow(command) });
}
```

## 2. Configuration and startup

- `ConfigModule.forRoot()` (`@nestjs/config`) in `AppModule` reads `apps/api/.env`.
- Database configuration is validated at startup and the app **fails fast**: `DATABASE_URL`
  missing or invalid, a user other than `app_user`, or a schema other than `app` aborts bootstrap
  (`parseDatabaseConfig`, `DatabaseConfigError`).
- An error message names the failed check only, never the URL, user password or other secret
  (AGENTS.md §7).
- `main.ts` enables shutdown hooks so Prisma disconnects on `SIGTERM` / `SIGINT`.
- The Prisma CLI config is `prisma.config.ts` (CLI default); the app does not read it.

## 3. Test levels and files

| Level       | File                             | Command         | Database     | Use for                                                                      |
| ----------- | -------------------------------- | --------------- | ------------ | ---------------------------------------------------------------------------- |
| unit        | `*.spec.ts` next to the code     | `pnpm test`     | none         | domain rules, value objects, use cases with in-memory fakes of ports         |
| integration | `*.int-spec.ts` next to the code | `pnpm test:int` | `pnpm db:up` | Prisma adapters, Unit of Work, transactions, authorization, sessions, outbox |
| e2e         | `test/*.e2e-spec.ts`             | `pnpm test:e2e` | `pnpm db:up` | HTTP contract: status codes, DTO validation, error format                    |

- `pnpm test` stays database-free; anything that needs PostgreSQL is `int` or `e2e`.
- Atomicity across modules is proven in an integration test with test-only fixtures (fake module
  adapters, test-created tables), not with production models.
- Mirrored validation rules iterate the shared vector sets (ADR-004).

## 4. Not decided yet

Project-wide conventions without an ADR (AGENTS.md §5): API error format, ID strategy,
pagination, date/time handling, logging format. The first story that needs one is `BLOCKED` until
its ADR is accepted; the epic backlog's Open questions name that story.
