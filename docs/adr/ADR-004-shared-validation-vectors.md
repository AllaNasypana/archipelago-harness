# ADR-004 — Where shared validation vectors live

- **Status:** Accepted (2026-11-12)
- **Deciders:** project owner
- **Related:** AGENTS.md §4.1, §5, §6; ADR-001 (Consequences); `docs/workflow/stage-map.yaml`
  `story_rules.layers`, `web_depends_on_api`

## Context

AGENTS.md §6 and ADR-001 require that a validation rule implemented in both `class-validator`
(api) and Zod (web) is tested with the **same** accept/reject vectors. Nothing says where they
live:

- `apps/web` must not import `apps/api` source (§4.1), so the api test file cannot be the source.
- `packages/api-client` is generated and server-only; hand-written data does not belong there.
- Copies in each app drift silently, which is exactly what the rule tries to prevent.

The first story to need this is US-01-03-api / US-01-03-web (name 2–100 trimmed, email, password
policy BR-002 incl. Unicode and 128 chars). Until this is decided, `implementation-planner` returns
`BLOCKED` for any story with a mirrored rule.

## Options

|       | Option                                                                                                                                                                               | For                                                                                                                                 | Against                                                                                                |
| ----- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ | ----------------------------------------------------------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------ |
| **A** | `packages/shared`, subpath export `@archipelago/shared/validation-vectors`; one file per rule set (`src/validation-vectors/password.ts`) exporting typed `{ accept, reject }` arrays | One source, typed, no new package; plain data is "framework-independent" (§4.1); both apps already can depend on workspace packages | Test data ships in a runtime package (tiny; a separate subpath keeps it out of the main entry)         |
| **B** | New dev-only package `packages/validation-vectors`, a `devDependency` of both apps                                                                                                   | Test data never reaches runtime; purpose is obvious from the name                                                                   | One more package and its config for a few files                                                        |
| **C** | JSON fixtures in `docs/stories/…` or a root `fixtures/` folder, read by path in tests                                                                                                | No package at all                                                                                                                   | Tests read files across app boundaries by relative path; no types; breaks "use package exports" (§4.1) |
| **D** | A copy in each app plus a script in CI that fails on drift                                                                                                                           | Each app self-contained                                                                                                             | Duplication by design; the check is one more thing to maintain                                         |

## Decision

**Option A.**

- Location: `packages/shared/src/validation-vectors/<rule-set>.ts`, re-exported only from the
  subpath `@archipelago/shared/validation-vectors` (not from the main entry).
- Shape: `export const passwordVectors = { accept: [{ value, note }], reject: [{ value, note }] }`
  — values and a one-line reason only; no error messages or codes (those differ per side).
- Ownership: the **api** story that owns the rule writes the set (at `TEST_FIRST`, as a test
  fixture with its hash in `tests.md`); the **web** story only imports it. A missing set is an api
  contract gap (`stage-map.yaml` → `web_depends_on_api`).
- Each set names its rule ID (e.g. BR-002) in a comment.

## Consequences

- `implementation-planner` stops returning `BLOCKED` for mirrored rules once this is `Accepted`.
- `apps/api` and `apps/web` add `@archipelago/shared` as a workspace dependency when the first
  vector set lands (US-01-03-api).
- AGENTS.md §6 gets one line pointing here.
