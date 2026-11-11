---
artifact_type: test_report
story: US-00-01-api
layer: api
version: 2
status: APPROVED
updated_at: 2026-11-11T17:55:57Z
produced_by: test-writer
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/plan.md, version: 1 }
---

# US-00-01-api — Tests

## Tests

Paths are under `apps/api/src/infrastructure/database/`.

| AC                           | Test file                         | Test name                                                                                                                         | Level       |
| ---------------------------- | --------------------------------- | --------------------------------------------------------------------------------------------------------------------------------- | ----------- |
| AC-1 (explicit schema, F2)   | `database-config.spec.ts`         | sets schema app explicitly on the adapter and on every connection (AC-1, F2)                                                      | unit        |
| AC-1 (explicit schema)       | `database-config.spec.ts`         | takes the schema from the parsed config, not a second constant (AC-1)                                                             | unit        |
| AC-1 (valid config)          | `database-config.spec.ts`         | accepts a URL for app_user and schema app (AC-1); accepts a Unicode password (AC-1)                                               | unit        |
| AC-1 (effect)                | `prisma.service.int-spec.ts`      | runs every query as app_user in schema app (AC-1)                                                                                 | integration |
| AC-2                         | `prisma-unit-of-work.int-spec.ts` | commits the writes of two modules together (AC-2)                                                                                 | integration |
| AC-2 (tx handle)             | `prisma-unit-of-work.spec.ts`     | returns the transaction client of a context opened by the Unit of Work (AC-2)                                                     | unit        |
| AC-3 (database failure, F3)  | `prisma-unit-of-work.int-spec.ts` | rolls back on a failed database write and rethrows that same error (AC-3, F3)                                                     | integration |
| AC-3 (application error, F3) | `prisma-unit-of-work.int-spec.ts` | rolls back on an application error and rethrows it unchanged (AC-3, F3)                                                           | integration |
| AC-3 (foreign context)       | `prisma-unit-of-work.spec.ts`     | rejects a context the Unit of Work did not create (AC-3)                                                                          | unit        |
| AC-4 (validation)            | `database-config.spec.ts`         | rejects %s, naming the failed check without secrets (AC-4) — 9 cases (`it.each`), incl. a malformed percent-encoded user (v2, R1) | unit        |
| AC-4 (Unicode secret)        | `database-config.spec.ts`         | never puts a Unicode password into the message (AC-4)                                                                             | unit        |
| AC-4 (bootstrap aborts, F1)  | `database.module.spec.ts`         | aborts startup on an invalid DATABASE_URL without exposing it (AC-4, F1)                                                          | unit        |

Every row of the plan's AC → test matrix has a test. AC-2/AC-3 integration tests create and drop
their own tables `app.uow_probe_{a,b}_<random>` (C1); after the red run no such table remained.

## Stubs

Created only so the tests compile; IMPLEMENTATION replaces their bodies (each throws
`not implemented` or is empty):

| File                                                          | Stub                                                                                            |
| ------------------------------------------------------------- | ----------------------------------------------------------------------------------------------- |
| `apps/api/src/infrastructure/database/database-config.ts`     | `parseDatabaseConfig`, `pgSettings` throw; `DatabaseConfigError`, constants and types are final |
| `apps/api/src/infrastructure/database/prisma.service.ts`      | `PrismaService` constructor throws before `super`                                               |
| `apps/api/src/infrastructure/database/prisma-unit-of-work.ts` | `PrismaTransaction` constructor, `prismaClientOf`, `PrismaUnitOfWork.run` throw                 |
| `apps/api/src/infrastructure/database/database.module.ts`     | empty `@Module({})`                                                                             |

Also written, final (plan rows 1 and 9; needed to compile and to run the integration tests):
`apps/api/src/common/unit-of-work.ts` (contract only), `apps/api/vitest.config.integration.ts`,
and the `test:int` script in `apps/api/package.json`.

## Red run

Environment: `pnpm db:up` (postgres and mailpit healthy), `apps/api/.env` present.

| Command (in `apps/api`) | Exit | Result                                                                            |
| ----------------------- | ---- | --------------------------------------------------------------------------------- |
| `pnpm typecheck`        | 0    | compiles                                                                          |
| `pnpm lint`             | 0    | clean                                                                             |
| `pnpm test`             | 1    | 3 files failed, 1 passed; 16 failed, 1 passed (existing `app.controller.spec.ts`) |
| `pnpm test:int`         | 1    | 2 files failed; 4 failed                                                          |

Failure reasons (all from missing behavior, none from syntax, import or setup):

- `database-config.spec.ts` (13): `Error: not implemented` from the stubs, or
  `expected Error: not implemented to be an instance of DatabaseConfigError`.
- `database.module.spec.ts` (1): `expected undefined to be an instance of DatabaseConfigError` —
  the empty module compiles, so startup does not abort yet.
- `prisma-unit-of-work.spec.ts` (2): `Error: not implemented` (positive case);
  the foreign-context case fails because the message is `not implemented`, not
  `not created by PrismaUnitOfWork`.
- `prisma.service.int-spec.ts` (1), `prisma-unit-of-work.int-spec.ts` (3): `Error: not implemented`
  from `parseDatabaseConfig` / `PrismaService`; the observer connection and test tables were set
  up successfully.

## Re-entry v2 (REVIEW `test_gap`, R1)

Added one `it.each` vector to `database-config.spec.ts`: user
`app%ZZ` (malformed percent-encoding) must fail with `DATABASE_URL user must be app_user` and no
secret. No other test changed (5 hashes unchanged).

| Command (in `apps/api`) | Exit | Result                                                                                                                           |
| ----------------------- | ---- | -------------------------------------------------------------------------------------------------------------------------------- |
| `pnpm typecheck`        | 0    |                                                                                                                                  |
| `pnpm lint`             | 0    |                                                                                                                                  |
| `pnpm test`             | 1    | 1 failed, 17 passed: `expected URIError: URI malformed to be an instance of DatabaseConfigError` — the missing behavior R1 names |

## Green on entry

None of the new or changed tests: the only new case fails. The 17 existing unit tests and 4
integration tests pass because IMPLEMENTATION v1 already exists; they are unchanged.

## Test file hashes

`shasum -a 256`, after Prettier formatting:

| Test file                                                              | SHA-256                                                            |
| ---------------------------------------------------------------------- | ------------------------------------------------------------------ |
| `apps/api/src/infrastructure/database/database-config.spec.ts`         | `3138db45d15b042bc48b92deb9fba494989f00abfc0ce984add334dc73989aed` |
| `apps/api/src/infrastructure/database/database.module.spec.ts`         | `2376ea938c9889be5323a209f11036686bd8f52e07a0a38cd89e9d841baffed7` |
| `apps/api/src/infrastructure/database/prisma-unit-of-work.spec.ts`     | `d5046b64c7f7bcbeefec91f2010b479a900430f22b246e3f46280b1e882085f4` |
| `apps/api/src/infrastructure/database/prisma-unit-of-work.int-spec.ts` | `49555e2effcc00e07837c4d04584e21d70e3d191dce0ce85b43b4ecf1a77982f` |
| `apps/api/src/infrastructure/database/prisma.service.int-spec.ts`      | `f833cfca0f1411fad8396935b8598c823e07d21fc1c38fb87efce66fd86dae7d` |
| `apps/api/vitest.config.integration.ts`                                | `fd794cf21569e2ce424f0989c1fbd61df27612d9e54327f35ee66f6f5d3b1f9b` |
