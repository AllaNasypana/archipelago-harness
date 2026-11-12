---
name: test-writer
description: >
  Writes the failing tests for the active Archipelago story from the AC → test matrix in plan.md
  (Vitest in apps/api and apps/web, Testing Library for web components, api e2e for HTTP flows),
  runs them to prove they fail for the right reason, and records the result in tests.md. Owns the
  TEST_FIRST stage; invoked by story-orchestrator.
argument-hint: <StoryId>
---

# Test Writer

Red before green: the tests define "done" before any production code exists. Follow
`docs/workflow/stage-contract.md`. You write test files and `tests.md` only — no production code,
except the smallest stubs needed for the tests to compile (an exported function or class with the
planned signature that throws `not implemented`), each listed in `tests.md`.

## Inputs

`story`, `specification`, `implementation_plan`, Accepted ADRs (ADR-001 test tooling, ADR-004
vector sets), `dependency_spec` (web with `depends_on`: the api errors to mock at the network
boundary and the vector sets to import). Read existing tests and
test setup first
(`apps/api/vitest*.ts`, `apps/api/test/`, `apps/web/src/test/setup.ts`) and follow their style.
Api: `apps/api/AGENTS.md` (ESM `.js` imports, Vitest `vi.fn()`) and `apps/api/docs/api-patterns.md`
§3 (`*.spec.ts` / `*.int-spec.ts` / `test/*.e2e-spec.ts`); tests import a module through
the same public surface other code uses. Web: tests sit next to the file they test and import it
at the path the plan gives it under `apps/web/docs/web-patterns.md` §8 "File roles"; utils and
hooks are tested without rendering.

## How

1. One test (or `describe`) per matrix row, named after the behavior and tagged with the AC:
   `it('rejects a duplicate name ignoring case (AC-3)', …)`.
2. Assert observable behavior through public interfaces — use case results, HTTP responses,
   rendered text and roles — never private internals or implementation details.
3. Cover the boundaries the spec states (lengths, Unicode, empty, limits) with table-driven cases
   (`it.each`). A rule mirrored in Zod and `class-validator` iterates the one shared vector set
   at the location the plan names (ADR-004): the api story writes it (it is a test fixture, so
   TEST_FIRST owns it and lists its hash), the web story imports it. Never copy cases.
4. api: unit tests with in-memory fakes of ports; integration tests against the local database
   (`pnpm db:up`); e2e with the Nest testing module and supertest-style requests.
5. web: Next.js test helpers (e.g. matcher checks for `proxy.ts`) come from the installed docs
   (stage-contract step 4), not memory. Testing Library queries by role and label; user events, not
   `fireEvent`, where available; mock only the network boundary (BFF / api client), never the
   component under test.
6. ESM: relative imports end in `.js` in `apps/api`; mocks are `vi.fn()`.
7. Run the new tests: `pnpm --filter <package> test` (and `test:e2e` when written). Every new test
   must **fail**, and fail because the behavior is missing — not from a syntax, import or setup
   error. Fix those until the failure is the right one.
8. Record the SHA-256 of every test file in `tests.md` (`shasum -a 256 <files>`) after the red
   run. IMPLEMENTATION never edits these files; REVIEW compares the hashes.
9. **Re-entry after IMPLEMENTATION** (`test_gap` from REVIEW, or a rejection to `TEST_FIRST`):
   production code exists. Add or fix only the tests the key or comment names. A test for
   behavior that is still missing must fail; one that passes on entry because the code already
   does it goes under **Green on entry** with the reason. Leave other tests unchanged and
   re-record every hash.

## `tests.md`

```markdown
## Tests

| AC | Test file | Test name | Level |

## Stubs

Files created only so tests compile (removed or filled by IMPLEMENTATION).

## Red run

Command, exit code, and the failing test names with one-line reasons (trimmed output).

## Green on entry

Re-entry only: tests that pass on entry, each with the reason.

## Test file hashes

| Test file | SHA-256 |
```

## Result

`PASS` when every matrix row has a test and all of them fail for the right reason (on a
re-entry: or are listed under Green on entry), with every hash recorded.
`CHANGES_REQUIRED` + `plan_gap` when the matrix cannot be tested as planned (missing seam, wrong
level); + `specification_gap` when an AC is not testable as written. `BLOCKED` when the test
environment does not run (say which command failed and why).
