---
artifact_type: implementation_plan
story: US-00-01-api
layer: api
version: 1
status: APPROVED
updated_at: 2026-11-11T17:40:41Z
produced_by: implementation-planner
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/spec-review.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 2 }
---

# US-00-01-api — Plan

## Approach

`infrastructure/database` gets four small pieces: a pure config parser (AC-4), a Prisma access
point that applies schema `app` itself (AC-1), a Prisma Unit of Work (AC-2, AC-3) and a Nest
module that wires them and exports only the Unit of Work. The contract that application code
depends on — the abstract `UnitOfWork` and the opaque `TransactionContext` — lives in `common/`,
so `domain/` and module `contracts/` never see Prisma or NestJS (F5). Nothing is added that the
four ACs do not need: no repository base class, no retry, no nested transactions, no model.

## Changes

| #   | File (create / modify)                                                             | What and why                                                                                                                                                                                                                                                                                                                                                                                                                                                                                            | AC         |
| --- | ---------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------- |
| 1   | `apps/api/src/common/unit-of-work.ts` (create)                                     | `export interface TransactionContext { readonly kind: 'transaction' }` (opaque marker) and `export abstract class UnitOfWork { abstract run<T>(work: (tx: TransactionContext) => Promise<T>): Promise<T> }` — the abstract class is also the Nest DI token. No imports from Prisma or NestJS.                                                                                                                                                                                                           | AC-2, AC-3 |
| 2   | `apps/api/src/infrastructure/database/database-config.ts` (create)                 | `parseDatabaseConfig(env)` → `{ url, user, schema }`; throws `DatabaseConfigError` whose message names the failed check only: `DATABASE_URL is missing`, `DATABASE_URL is not a valid URL`, `DATABASE_URL user must be app_user`, `DATABASE_URL schema must be app`. Expected values are module constants (`APP_DB_USER`, `APP_DB_SCHEMA`). `pgSettings(config)` → `{ poolConfig: { connectionString, options: '-c search_path=<schema>' }, adapterOptions: { schema } }`, both from the parsed config. | AC-1, AC-4 |
| 3   | `apps/api/src/infrastructure/database/prisma.service.ts` (create)                  | `PrismaService extends PrismaClient` (from `./generated/prisma/client.js`), constructed with `new PrismaPg(poolConfig, adapterOptions)` from `pgSettings`. `onModuleInit` → `$connect()`, `onModuleDestroy` → `$disconnect()`. Not exported from the module.                                                                                                                                                                                                                                            | AC-1       |
| 4   | `apps/api/src/infrastructure/database/prisma-unit-of-work.ts` (create)             | `PrismaUnitOfWork extends UnitOfWork`: `run(work)` = `prisma.$transaction((client) => work(new PrismaTransaction(client)), { isolationLevel: ReadCommitted })`. No catch, no wrap, no log: Prisma rolls back and rethrows the same error (C4). `PrismaTransaction implements TransactionContext` holds the transaction client. `prismaClientOf(tx)` returns it after an `instanceof` check (throws on a foreign context) — the only way an infrastructure adapter gets the client (F5).                 | AC-2, AC-3 |
| 5   | `apps/api/src/infrastructure/database/database.module.ts` (create)                 | Provides the parsed config (factory reading `ConfigService`, so a bad value aborts bootstrap), `PrismaService`, and `{ provide: UnitOfWork, useClass: PrismaUnitOfWork }`; exports `UnitOfWork` only.                                                                                                                                                                                                                                                                                                   | AC-1, AC-4 |
| 6   | `apps/api/src/app.module.ts` (modify)                                              | Import `ConfigModule.forRoot()` (`@nestjs/config`, already a dependency; reads `apps/api/.env`) and `DatabaseModule`.                                                                                                                                                                                                                                                                                                                                                                                   | AC-1, AC-4 |
| 7   | `apps/api/src/main.ts` (modify)                                                    | `app.enableShutdownHooks()` so `onModuleDestroy` disconnects on SIGTERM/SIGINT.                                                                                                                                                                                                                                                                                                                                                                                                                         | AC-1       |
| 8   | `apps/api/prisma7.config.ts` → `apps/api/prisma.config.ts` (rename)                | The Prisma CLI loads `prisma.config.ts` by default; one config file for CLI commands (F4). Content unchanged. The app does not use it: it reads `DATABASE_URL` through `@nestjs/config`.                                                                                                                                                                                                                                                                                                                | —          |
| 9   | `apps/api/vitest.config.integration.ts` (create), `apps/api/package.json` (modify) | Integration tests use `*.int-spec.ts` (not matched by the unit pattern `**/*.spec.ts`), run by a new script `test:int` with `setupFiles: ['dotenv/config']`. `pnpm test` stays database-free.                                                                                                                                                                                                                                                                                                           | —          |
| 10  | `apps/api/vitest.config.e2e.ts` (modify)                                           | Add `setupFiles: ['dotenv/config']`: `AppModule` now needs `DATABASE_URL` and a running database.                                                                                                                                                                                                                                                                                                                                                                                                       | —          |
| 11  | `apps/api/README.md` (modify)                                                      | Config file name `prisma.config.ts`; `pnpm test:int` in the command table (needs `pnpm db:up`); e2e needs the database.                                                                                                                                                                                                                                                                                                                                                                                 | —          |
| 12  | `apps/api/src/infrastructure/database/.gitkeep` (delete)                           | The folder now has files.                                                                                                                                                                                                                                                                                                                                                                                                                                                                               | —          |
| 13  | `src/infrastructure/database/generated/` (regenerate)                              | `pnpm --filter @archipelago/api prisma:generate`; generated, git-ignored, never edited.                                                                                                                                                                                                                                                                                                                                                                                                                 | —          |

Order: 1 → 2 → 3 → 4 → 5 → 6 → 7, then 8–12.

## Impact

- `test/app.e2e-spec.ts` boots `AppModule`, which now connects to PostgreSQL: e2e runs need
  `pnpm db:up` and `apps/api/.env`. Its assertions do not change.
- `src/app.controller.spec.ts` builds only the controller; unaffected.
- `pnpm dev` and `start:prod` refuse to start without a valid `DATABASE_URL` (AC-4, intended).
- Future modules reach the database only through `UnitOfWork` and `prismaClientOf(tx)`; reads
  outside a Unit of Work are not provided yet — the first story that needs one adds it.
- No change to `packages/api-client`, OpenAPI, `bff` or `apps/web`.

## Migration

None (C1). `prisma/schema.prisma` is unchanged.

## Decisions

| Decision                                            | Choice and why                                                                                                                                                             |
| --------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Where `UnitOfWork` / `TransactionContext` live (F5) | `src/common/unit-of-work.ts`: technical, no business logic, no Prisma or NestJS import, usable by `application/` and `workflows/` (apps/api/AGENTS.md "common/").          |
| How an adapter gets the transactional client (F5)   | `prismaClientOf(tx)` with an `instanceof PrismaTransaction` check — no type cast, fails loudly on a foreign context.                                                       |
| Environment loading                                 | `@nestjs/config` `ConfigModule.forRoot()` — first-party, already in `dependencies`; no new package.                                                                        |
| Prisma config file (F4)                             | Rename to `prisma.config.ts`, the CLI default; the app does not read it.                                                                                                   |
| Integration test separation (spec open point)       | `*.int-spec.ts` + `vitest.config.integration.ts` + `test:int`, mirroring the existing `*.e2e-spec.ts` / `test:e2e` pattern. **Adds a script: please confirm at the gate.** |
| `common/` with fewer than two concrete uses         | Accepted: the Unit of Work is mandated by AGENTS.md §3.9 and its users (registration, sign-in, reset, Google) are in this backlog.                                         |

No new dependency, no ADR needed.

## AC → test matrix

| AC                           | Test level  | Test file                                                     | Cases (incl. boundaries)                                                                                                                                                                                                                                                              |
| ---------------------------- | ----------- | ------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| AC-1 (explicit schema, F2)   | unit        | `src/infrastructure/database/database-config.spec.ts`         | `pgSettings` gives `adapterOptions.schema === 'app'` and `poolConfig.options === '-c search_path=app'`, derived from the parsed config.                                                                                                                                               |
| AC-1 (effect)                | integration | `src/infrastructure/database/prisma.service.int-spec.ts`      | Through `PrismaService`: `current_user` = `app_user`, `current_schema()` = `app`, `SHOW search_path` = `app`.                                                                                                                                                                         |
| AC-2                         | integration | `src/infrastructure/database/prisma-unit-of-work.int-spec.ts` | Two fake module adapters (each using `prismaClientOf(tx)`) insert into two test tables in one `run`; both rows visible from a separate `pg` connection; `run` returns the callback's value.                                                                                           |
| AC-3 (database failure, F3)  | integration | same file                                                     | Adapter A inserts, adapter B violates a unique constraint; A's row is not visible from a separate connection; the rejection is the same object adapter B caught and rethrew (`toBe`).                                                                                                 |
| AC-3 (application error, F3) | integration | same file                                                     | A inserts, then the callback throws `new Error('boom')`; row not visible; rejection `toBe` that error.                                                                                                                                                                                |
| AC-3 (foreign context)       | unit        | `src/infrastructure/database/prisma-unit-of-work.spec.ts`     | `prismaClientOf` throws for a context not created by `PrismaUnitOfWork`.                                                                                                                                                                                                              |
| AC-4 (validation)            | unit        | `src/infrastructure/database/database-config.spec.ts`         | `it.each`: missing, empty string, not a URL, user `postgres`, user `bff_user`, schema missing, schema `bff`, schema `public`; each message names the check and contains neither the URL nor the password (`change-me-app`, a Unicode password `pässwörd`). Valid URL → parsed config. |
| AC-4 (bootstrap aborts, F1)  | unit        | `src/infrastructure/database/database.module.spec.ts`         | `Test.createTestingModule({ imports: [ConfigModule.forRoot({ ignoreEnvFile: true, load: [() => ({ DATABASE_URL: <bad> })] }), DatabaseModule] }).compile()` rejects with `DatabaseConfigError`; message has no URL/password. No database needed.                                      |

Test tables for AC-2/AC-3 are created by the test in schema `app` with a per-run suffix
(`uow_probe_a_<random>`, `uow_probe_b_<random>`) in `beforeAll` and dropped in `afterAll`; no
migration (C1).

## Checks

Beyond the REVIEW baseline:

```bash
pnpm db:up
pnpm --filter @archipelago/api prisma:generate
pnpm --filter @archipelago/api test:int
pnpm --filter @archipelago/api test:e2e
```
