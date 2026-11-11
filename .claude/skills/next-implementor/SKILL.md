---
name: next-implementor
description: >
  Implements an Archipelago web story in apps/web (Next.js App Router, React, Tailwind,
  shadcn/ui, TanStack Query, React Hook Form + Zod, thin BFF) by making the TEST_FIRST tests pass,
  following the approved spec and plan, and writes implementation.md. The IMPLEMENTATION Skill for
  layer web; invoked by story-orchestrator.
argument-hint: <StoryId>
---

# Next Implementor

Green: make the failing tests pass with the simplest code that meets the spec and the plan.
Follow `docs/workflow/stage-contract.md`, `AGENTS.md`, `apps/web/AGENTS.md` ("Web rules", "Web
code principles", "Styling") and `apps/web/docs/web-patterns.md` — all binding.

## Inputs

`story`, `specification`, `implementation_plan`, `test_report`, the active epic's `decisions.md`,
and the api dependency's `spec.md`. This Next.js version differs from older ones: read the
relevant guide in `node_modules/next/dist/docs/` before using an API you are unsure of.

## How

1. Work through `plan.md` → Changes in order; run the story's tests often
   (`pnpm --filter @archipelago/web test`).
2. Feature code in `features/<feature>/`; `app/` routes only compose. Server Components by
   default, `"use client"` only on interactive leaves; data loaded on the server, not in
   `useEffect`.
3. Data: Client Components call same-origin BFF route handlers; server code calls NestJS only
   through `lib/api` and the generated client. Tokens never reach props, client caches or logs;
   cookie changes only in route handlers or server actions.
4. Forms: React Hook Form + the Zod schema from the plan; types from `z.infer` and the generated
   client, never hand-written duplicates.
5. Styling: tokens from `theme.css` via Tailwind utilities, classes from `components.css`; no raw
   hex values. Reuse `components/ui` primitives.
6. Every UI string from the `en`/`uk` message files; add both keys.
7. All UI states from the spec; keyboard path, labels and visible focus.
8. Remove every stub listed in `tests.md`. Never weaken a test to make it pass; a wrong test →
   `CHANGES_REQUIRED` + `plan_gap`.
9. Finish with `pnpm --filter @archipelago/web lint typecheck test`.

A web story never changes NestJS code or the api contract; a contract gap → `BLOCKED`.

## Code bar

Small components with explicit props, hooks with one purpose (`useX`), handlers `handleX`,
kebab-case files, no `any` or non-null assertions, no abstraction without a second use.

## `implementation.md`

Same sections as `nest-implementor`: Changes (file, change, AC), Deviations from the plan, Green
run (commands, exit codes, trimmed output), Notes for review.

## Result

`PASS` when all story tests and the package checks pass. `CHANGES_REQUIRED` + `partial` when work
remains; + `plan_gap` when the plan cannot be followed. `BLOCKED` for an environment failure, a
missing decision or an api contract gap.
