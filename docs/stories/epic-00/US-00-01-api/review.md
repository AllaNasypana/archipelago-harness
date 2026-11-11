---
artifact_type: review
story: US-00-01-api
layer: api
version: 2
status: APPROVED
updated_at: 2026-11-11T17:58:23Z
produced_by: story-reviewer
verdict: PASS
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/clarification.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-api/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/spec-review.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/plan.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-api/tests.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/implementation.md, version: 2 }
---

# US-00-01-api — Review

## Verdict

PASS. Every check passes, the six test-file hashes match `tests.md` v2, every AC (AC-1 to AC-4)
has a passing test, and R1, R2 and R3 from v1 are resolved. No findings are open.

## Checks

Run from the repo root on 2026-11-11 with local Docker (postgres and mailpit healthy) and
`apps/api/.env` present.

| Command                                                 | Exit | Result                                                                                               |
| ------------------------------------------------------- | ---- | ---------------------------------------------------------------------------------------------------- |
| `pnpm db:up`                                            | 0    | postgres Healthy, mailpit Healthy                                                                    |
| `pnpm --filter @archipelago/api prisma:generate`        | 0    | Prisma Client 7.10.1 generated to `src/infrastructure/database/generated/prisma`                     |
| `pnpm turbo run lint typecheck test build --force`      | 0    | 12/12 tasks successful, uncached; api lint 0 warnings/0 errors; api 4 files/18 tests; web 7 tests    |
| `pnpm --filter @archipelago/api test:int`               | 0    | 2 files, 4 tests passed                                                                              |
| `pnpm --filter @archipelago/api test:e2e`               | 0    | 1 file, 1 test passed (AppModule boots against the database)                                         |
| `shasum -a 256` on the 6 files listed in `tests.md` v2  | —    | 6/6 match                                                                                            |
| `information_schema.tables` count for schema `app`      | —    | 0 after the integration run (no leftover probe tables, C1)                                           |

## AC coverage

| AC   | Test                                                                                                                                                                                                                                                                  | Passing |
| ---- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------- |
| AC-1 | `database-config.spec.ts` › `pgSettings` sets `schema: 'app'` on the adapter and `-c search_path=app` per connection, both from the parsed config (2 tests); accepts a valid and a Unicode-password URL. `prisma.service.int-spec.ts` › `current_user`=`app_user`, `current_schema()`=`app`, `search_path`=`app` | yes     |
| AC-2 | `prisma-unit-of-work.int-spec.ts` › commits the writes of two modules together, checked from a separate `pg` connection, and returns the callback's value. `prisma-unit-of-work.spec.ts` › `prismaClientOf` returns the transaction client                                | yes     |
| AC-3 | `prisma-unit-of-work.int-spec.ts` › rolls back on a failed DB write and rethrows the same error (`toBe`); rolls back on an application error and rethrows it unchanged (`toBe`). `prisma-unit-of-work.spec.ts` › rejects a foreign context                               | yes     |
| AC-4 | `database-config.spec.ts` › `it.each` covers 9 cases (missing, empty, not a URL, user `postgres`, user `bff_user`, malformed user `app%ZZ`, schema missing, `bff`, `public`), each asserting `DatabaseConfigError`, the named check and no secret; plus a Unicode password case. `database.module.spec.ts` › module compile rejects with `DatabaseConfigError` and the message contains no URL or password | yes     |

## Review notes

- **Correctness.** The code matches spec v2 and plan v1. `run` = `$transaction(..., { isolationLevel: ReadCommitted })` with no catch, wrap or log (C3, C4). The schema is applied in two places from one validated value (spec "Schema `app`"). The one deviation, the `DATABASE_CONFIG` DI token, is justified in `implementation.md` and minimal. Since v1 only `database-config.ts` (R1), `prisma.config.ts` (R3) and `src/common/.gitkeep` (R2) changed; no test file changed except the added R1 vector. No stubs are left.
- **R1 fix.** `parsed.username !== APP_DB_USER` compares the username as written, with no `decodeURIComponent`. `app%ZZ` now fails the named user check. This is also stricter in a safe direction: a percent-encoded spelling of `app_user` (e.g. `app%5Fuser`) is rejected instead of accepted, which is acceptable because `app_user` never needs encoding.
- **Boundaries.** `src/common/unit-of-work.ts` has no Prisma or NestJS import (§3.6, §3.8). `DatabaseModule` exports only `UnitOfWork`, and `PrismaService` is not exported. Only schema `app` is used, nothing touches `bff`, and there is no migration (C1). There are no cross-module imports, because no business modules exist yet.
- **Security.** The messages in `DatabaseConfigError` are fixed strings, and the `URL` `TypeError` is deliberately not attached as `cause`. Nothing is logged. `search_path` is built from the `APP_DB_SCHEMA` constant after validation, so the URL cannot inject anything. `.env` is git-ignored and no secrets are committed. There is no HTTP surface, so authorization and CSRF do not apply.
- **Contract.** No OpenAPI or `packages/api-client` change, as the spec requires.
- **Readability.** The units are small and well named, with comments only where they explain intent. No speculative abstraction.
- **Scope.** The changes stay inside `apps/api` (plus workflow docs). `apps/web` and `packages/*` are untouched.

## Findings

| #  | Severity | Part        | File:line                                                    | Finding                                                                                                                                                                                                   | Fix | Status                                                                                                                       |
| -- | -------- | ----------- | ------------------------------------------------------------ | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | --- | ---------------------------------------------------------------------------------------------------------------------------- |
| R1 | blocking | Correctness | `apps/api/src/infrastructure/database/database-config.ts:42` | v1: `decodeURIComponent(parsed.username)` threw a bare `URIError` for a malformed percent-encoded user (`app%ZZ`) instead of the named AC-4 check, and no test covered it.                                  | —   | **Resolved.** Vector added (`database-config.spec.ts:56`); the username is compared without decoding; the test passes.         |
| R2 | low      | Scope       | `apps/api/src/common/.gitkeep`                               | v1: a leftover placeholder next to `unit-of-work.ts`.                                                                                                                                                     | —   | **Resolved.** Deleted (`git status`: `D apps/api/src/common/.gitkeep`).                                                         |
| R3 | low      | Readability | `apps/api/prisma.config.ts:1`                                | v1: a stale generated header ("npm install …").                                                                                                                                                          | —   | **Resolved.** Replaced by "Prisma CLI config only; the app reads DATABASE_URL through @nestjs/config."                         |

No findings are open.

## For the human

- **Where to look in the diff.** `prisma-unit-of-work.ts` (whole file, 35 lines) and `database-config.ts` (`parseDatabaseConfig`, `pgSettings`). These two files carry the atomicity (BR-001, REG-03) and the explicit `app` schema (AC-1, F2) that later stories build on.
- **Plan-gate item.** The new `test:int` script and the `*.int-spec.ts` pattern were flagged in the plan for confirmation. `pnpm test` matches only `*.spec.ts` and so stays database-free. This was read from the config, not verified by a run with the database down. `test:int` and `test:e2e` both need `pnpm db:up`.
- **Report inconsistency (no code impact).** `implementation.md` v2 still carries two v1 lines: the "Green run" table says 17 unit tests (v2 runs 18, as the v2 revision paragraph states), and "Notes for review" still says `src/common/.gitkeep` is present (it is deleted).
- **Residual risk: boundary enforcement is by convention.** `PrismaTransaction.client` and `prismaClientOf` can be imported by any file, and no lint or dependency rule yet stops `application/` code from importing `infrastructure/database/*`. When the first business module lands (US-01-01-api / US-01-03-api), consider an architecture/dependency check (AGENTS.md §6).
- **Residual risk: hard-coded role.** AC-4 hard-codes `app_user`/`app` (C5). A production role with another name will need a config change later, as the spec already notes.
- **Residual risk: duplicate schema parameter.** `?schema=app&schema=bff` passes validation because `searchParams.get` reads the first value. This is harmless: the effective schema always comes from the `APP_DB_SCHEMA` constant, and `pg` ignores the parameter.
- **CI follow-up.** CI will need PostgreSQL for `test:int` and `test:e2e`. Check this when CI is wired.
- **Follow-up.** There are no reads outside a Unit of Work yet. The first story that needs one adds it (plan "Impact").
