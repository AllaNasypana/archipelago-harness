---
artifact_type: specification_review
story: US-00-01-api
layer: api
version: 2
status: APPROVED
updated_at: 2026-11-11T17:28:21Z
produced_by: spec-reviewer
verdict: PASS
inputs:
  - { path: docs/stories/epic-00/US-00-01-api/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-api/clarification.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-api/spec.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 2 }
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md }
  - { path: docs/adr/ADR-001-web-testing.md }
  - { path: docs/adr/ADR-002-google-sign-in.md }
  - { path: docs/adr/ADR-003-react-compiler.md }
---

# US-00-01-api — Specification review

## Verdict

PASS — spec v2 resolves F2 (the access point now sets schema `app` itself, through the adapter's
`schema` option and each connection's `search_path`, with a unit test that fails if the role
default is relied on); no blocking findings remain, and F1, F3, F4, F5 stay open for PLANNING as
the human decided.

## Findings

| #   | Severity     | Area         | Spec location                                 | Finding                                                                                                                                                                                                                                                                                                                                                                                                                                                                                        | Fix                                                                                                                                                                                            | Status                         |
| --- | ------------ | ------------ | --------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- | ------------------------------ |
| F1  | non-blocking | Testability  | Tests (C1) → AC-4                             | AC-4 is about the API refusing to start, but the tests cover only unit tests of the validation function. Nothing proves that a failing check aborts bootstrap.                                                                                                                                                                                                                                                                                                                               | AC → test matrix includes one test that bootstrapping the database module (or `AppModule`) with an invalid `DATABASE_URL` rejects, with the message free of URL/password.                      | Open — deferred to PLANNING    |
| F2  | non-blocking | Testability  | AC-1; Schema `app`; Tests → AC-1              | v1: the AC-1 test passed on `app_user`'s role default `search_path`, so it could not prove the access point applies schema `app`. v2 makes the access point set it explicitly (adapter `schema` option + per-connection `search_path`, both from the validated config) and adds a unit test that fails without it; the integration test checks the effect. Verified feasible: `@prisma/adapter-pg` 7.10.1 `PrismaPgOptions.schema` exists and the adapter ignores the URL `schema` parameter; `pg.PoolConfig.options` (`@types/pg` 8.23.1) can carry `-c search_path=app`. | —                                                                                                                                                                                              | Resolved in spec v2            |
| F3  | non-blocking | Faithfulness | AC-3                                          | Story AC-3 says "a write in the Unit of Work fails"; spec AC-3 says "a later step throws". A plain JS throw does not exercise a failing database write (aborted PostgreSQL transaction, Prisma error object).                                                                                                                                                                                                                                                                                 | Test matrix covers both: a write through the second adapter that fails in the database (e.g. constraint violation) and a thrown application error; both roll back and rethrow the same object. | Open — deferred to PLANNING    |
| F4  | non-blocking | Coverage     | Persistence → Prisma config                   | The clarification's Spec checklist asks which Prisma config file the CLI and the app use; the spec defers it to the plan. Low impact (no migration in this story).                                                                                                                                                                                                                                                                                                                         | Plan names the single config file (`prisma7.config.ts` is not loaded by default) and how `prisma:generate` / later migrations find it.                                                         | Open — deferred to PLANNING    |
| F5  | non-blocking | Boundaries   | Unit of Work contract                         | The spec leaves open how an `infrastructure/` adapter turns the opaque `TransactionContext` into the transactional Prisma client without exporting Prisma types or the client to modules.                                                                                                                                                                                                                                                                                                    | Plan fixes the mechanism and file location of `TransactionContext` / Unit of Work port, keeping `domain/` and `contracts/` free of Prisma and NestJS (AGENTS.md §3.6, §3.8).                   | Open — deferred to PLANNING    |

## Checked

- Coverage: OK — story AC-1…AC-4, C1–C5, Q6, Q7 present; Open points record F1, F3, F4, F5 as deferred to PLANNING; F4.
- Testability: OK for AC-1 now (F2 resolved); F1, F3 open.
- Faithfulness: OK — the v2 changes are limited to AC-1, the access point row, the Schema `app` section and AC-1 tests, all backed by §6.1, AGENTS.md §3.4 and the human's rejection comment; F3.
- Boundaries: OK — `app` schema only and now enforced by the access point, schema value taken only from validated config, no Prisma types in contracts, client not exported, no side effects; F5.
- Security: OK — no endpoint, so no authorization rule; URL and password never in logs or messages (AGENTS.md §7, NFR-004); no grant on `bff`.
- Contract (web): n/a (api story).
- Design (web): n/a (api story).
- Conventions: OK — no API error format, ID, logging or pagination convention invented.
- Size and quality: OK — still one infrastructure component set; the explicit schema setting is two config values, not a new layer.
- Risk: OK — `high` matches `story_rules.risk` (cross-module transaction).

## Revisions

- v2: reviewed spec v2; F2 resolved; F1, F3, F4, F5 unchanged and deferred to PLANNING per human decision; Status column added.
