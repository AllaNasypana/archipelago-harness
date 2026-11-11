---
artifact_type: implementation_report
story: US-00-01-api
layer: api
version: 2
status: APPROVED
updated_at: 2026-11-11T17:56:54Z
produced_by: nest-implementor
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/plan.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-api/tests.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/review.md, version: 1 }
  - { path: docs/stories/epic-01/decisions.md, version: 2 }
---

# US-00-01-api — Implementation

## Changes

Paths under `apps/api/`.

| File                                                 | Change                                                                                                                                                                         | AC         |
| ---------------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ---------- |
| `src/infrastructure/database/database-config.ts`     | Stub replaced: `parseDatabaseConfig` (present, valid URL, user `app_user`, `?schema=app`; messages name the check only), `pgSettings`, `DATABASE_CONFIG` token                 | AC-1, AC-4 |
| `src/infrastructure/database/prisma.service.ts`      | Stub replaced: `PrismaClient` with `PrismaPg(poolConfig with search_path, { schema })`; connect on init, disconnect on destroy                                                 | AC-1       |
| `src/infrastructure/database/prisma-unit-of-work.ts` | Stub replaced: `PrismaUnitOfWork.run` = `$transaction(…, { isolationLevel: ReadCommitted })`, no catch/wrap/log; `PrismaTransaction`; `prismaClientOf` with `instanceof` check | AC-2, AC-3 |
| `src/infrastructure/database/database.module.ts`     | Stub replaced: config factory over `ConfigService`, `PrismaService`, `UnitOfWork → PrismaUnitOfWork`; exports `UnitOfWork` only                                                | AC-1, AC-4 |
| `src/app.module.ts`                                  | Imports `ConfigModule.forRoot()` and `DatabaseModule`                                                                                                                          | AC-1, AC-4 |
| `src/main.ts`                                        | `app.enableShutdownHooks()`                                                                                                                                                    | AC-1       |
| `prisma7.config.ts` → `prisma.config.ts`             | Renamed (content unchanged); `pnpm prisma:generate` works with it                                                                                                              | —          |
| `vitest.config.e2e.ts`                               | `setupFiles: ['dotenv/config']`                                                                                                                                                | —          |
| `README.md`                                          | Config file name, `DATABASE_URL` rule, `test:int`, e2e needs the database                                                                                                      | —          |
| `src/infrastructure/database/.gitkeep`               | Deleted                                                                                                                                                                        | —          |
| `src/infrastructure/database/generated/`             | Regenerated (`prisma:generate`), git-ignored                                                                                                                                   | —          |

Written at TEST_FIRST and not changed here: `src/common/unit-of-work.ts`,
`vitest.config.integration.ts`, the `test:int` script, and every test file.

## Revision v2 (after REVIEW v1)

| Finding       | File                                             | Change                                                                                                                                                                                      |
| ------------- | ------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| R1 (blocking) | `src/infrastructure/database/database-config.ts` | Username compared as written (`parsed.username !== APP_DB_USER`), no `decodeURIComponent`, so a malformed percent-encoding fails the named user check instead of throwing `URIError` (AC-4) |
| R2            | `src/common/.gitkeep`                            | Deleted                                                                                                                                                                                     |
| R3            | `prisma.config.ts`                               | Stale generated header replaced by one line on what the file is for                                                                                                                         |

Green run v2 (database up): `prisma:generate` 0; `typecheck` 0; `lint` 0; `test` 0 (4 files,
18 tests); `test:int` 0 (4 tests); `test:e2e` 0 (1 test); `build` 0;
`pnpm turbo run lint typecheck test` 0 (10/10); `shasum -a 256 -c` against `tests.md` v2: 6/6 OK;
schema `app` has 0 tables afterwards.

## Deviations from the plan

- `DATABASE_CONFIG` (a `Symbol` DI token in `database-config.ts`) was added so `PrismaService` can
  receive the validated config through Nest DI; the plan named the factory but not its token.
- None otherwise. No test file was edited (hashes below), no dependency added, no migration.

## Green run

Environment: `pnpm db:up` (postgres, mailpit healthy), `apps/api/.env` present.

| Command                                          | Exit | Result                                 |
| ------------------------------------------------ | ---- | -------------------------------------- |
| `pnpm --filter @archipelago/api prisma:generate` | 0    | client generated                       |
| `pnpm --filter @archipelago/api typecheck`       | 0    |                                        |
| `pnpm --filter @archipelago/api lint`            | 0    | 0 warnings, 0 errors                   |
| `pnpm --filter @archipelago/api test`            | 0    | 4 files, 17 tests passed               |
| `pnpm --filter @archipelago/api test:int`        | 0    | 2 files, 4 tests passed                |
| `pnpm --filter @archipelago/api test:e2e`        | 0    | 1 file, 1 test passed (AppModule + DB) |
| `pnpm --filter @archipelago/api build`           | 0    |                                        |
| `pnpm turbo run lint typecheck test`             | 0    | 10/10 tasks successful (all packages)  |
| `shasum -a 256 -c` against `tests.md` hashes     | 0    | 6/6 OK                                 |

No `not implemented` / `STUB` left in `apps/api/src` or `apps/api/test`. After the integration
run schema `app` has 0 tables (test tables dropped).

## Notes for review

- `prisma-unit-of-work.ts`: relies on Prisma's interactive `$transaction` rolling back and
  rethrowing the callback's own error object; the AC-3 integration tests assert identity (`toBe`)
  for both a database error and an application error.
- `database-config.ts`: the `URL` parser's `TypeError` is deliberately not attached as `cause`,
  because Node puts the input (with the password) on it.
- `pgSettings` passes the full `DATABASE_URL` (including `?schema=app`) as `connectionString`;
  `pg` ignores the unknown `schema` parameter, and `options` sets `search_path` (AC-1 integration
  test confirms `search_path` = `app`).
- `test/app.e2e-spec.ts` now needs the database; unchanged otherwise.
- `src/common/.gitkeep` is still present next to `unit-of-work.ts` (outside the plan; harmless).
