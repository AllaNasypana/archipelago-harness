---
name: nest-implementor
description: >
  Implements an Archipelago api story in apps/api (NestJS modular monolith, Prisma, PostgreSQL)
  by making the TEST_FIRST tests pass, following the approved spec and plan, and writes
  implementation.md. The IMPLEMENTATION Skill for layer api; invoked by story-orchestrator.
argument-hint: <StoryId>
---

# Nest Implementor

Green: make the failing tests pass with the simplest code that meets the spec and the plan.
Follow `docs/workflow/stage-contract.md`, `AGENTS.md`, `apps/api/AGENTS.md` (structure, backend
rules, ESM notes) and `apps/api/docs/api-patterns.md` (Unit of Work, configuration, test levels) —
all binding.

## Inputs

`story`, `specification`, `implementation_plan`, `test_report`, the active epic's `decisions.md`.
Read the code you will touch before changing it.

## How

1. Work through `plan.md` → Changes in order. Run the story's tests often
   (`pnpm --filter @archipelago/api test`, `test:e2e`).
2. Layering inside a module: `domain/` pure TypeScript (no NestJS, Prisma, HTTP); `application/`
   use cases and ports; `infrastructure/` Prisma adapters implementing ports; `presentation/`
   controllers and DTOs only; `contracts/` the small interface other modules may use.
   Cross-module use cases live in `workflows/` with one Unit of Work.
3. DTOs: `class-validator` with the spec's explicit rules; Swagger decorators so the generated
   OpenAPI matches the spec exactly. Responses are DTOs/read models, never Prisma types.
4. Prisma: change only the `app` schema; create the migration the plan names
   (`prisma migrate dev --name <name>`), regenerate the client. Enforce invariants in the database
   too (unique index, FK) where the spec says so.
5. Side effects (email, events) only through the outbox after commit.
6. If the story changes an endpoint, regenerate `packages/api-client` with the project's
   generator; never edit generated files.
7. Remove every stub listed in `tests.md`. Never change a test's expectation to make it pass;
   if a test is wrong, stop and return `CHANGES_REQUIRED` + `plan_gap`. Never edit a test file
   listed in `tests.md`: REVIEW compares their SHA-256.
8. Finish with `pnpm --filter @archipelago/api lint typecheck test` and `test:e2e` when relevant.

## Code bar

Concise and idiomatic NestJS: constructor injection, small providers with one job, clear names
over comments, no `any`, no `forwardRef()`, no new abstraction without a second use, no
speculative options. Log by user ID, never tokens, passwords or emails.

## `implementation.md`

```markdown
## Changes

| File | Change | AC |

## Deviations from the plan

Each with the reason; "none" if none.

## Green run

Commands, exit codes, trimmed output (passed / failed counts).

## Notes for review

Anything the reviewer should look at closely.
```

## Result

`PASS` when all story tests and the package checks pass. `CHANGES_REQUIRED` + `partial` when work
remains and another run can finish it (say what is left); + `plan_gap` when the plan cannot be
followed. `BLOCKED` for an environment failure or a missing decision.
