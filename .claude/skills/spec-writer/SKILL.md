---
name: spec-writer
description: >
  Writes spec.md for the active Archipelago story from its story.md and approved clarification:
  testable acceptance criteria plus the design section for the story's layer — api (endpoints,
  DTOs, errors, authorization, domain rules, Prisma) or web (route, components, form, UI states,
  mockups, en/uk keys, BFF calls). Owns the SPECIFICATION stage; invoked by story-orchestrator.
  Use when someone asks to write or revise a story's specification.
argument-hint: <StoryId>
---

# Spec Writer

Turns the story and its clarification into the single document the plan, tests, code and review
are checked against. Follow `docs/workflow/stage-contract.md`.

## Inputs

`story`, `clarification` (must be `APPROVED`), the active epic's `decisions.md`,
`dependency_spec` (web with `depends_on`), `docs/design/README.md` (web). Read the epic and BRD
rules the story cites, Accepted ADRs, and the code the story touches.

The clarification's **Spec checklist** is a to-do list: every item ends up in the spec, or the
spec says why not.

## `spec.md`

Front matter per `artifact-schema.md`, plus `risk: normal | high` — the story's risk, raised to
`high` if a `story_rules.risk.high_when` rule now applies (never lowered).

```markdown
# US-03-02-api — Create a Goal

## Summary

Two or three sentences: what changes for whom.

## Acceptance criteria

- **AC-1** Given … when … then … _(GOAL-AC-01, BR-009, C1)_
  One per story AC, refined by the clarification. Each is observable and testable on its own;
  edge and error behavior gets its own AC. Never more than the story allows (2–5 + clarified
  edge cases; if it grows past ~7, the story is too big: return BLOCKED and say so).

## Out of scope

## Design — api | web (only the story's layer; sections below)

## Open points

Non-blocking notes for planning. Anything blocking means BLOCKED, not a note.
```

### Design — api

| Section       | Content                                                                                                   |
| ------------- | --------------------------------------------------------------------------------------------------------- |
| Endpoints     | method, path under `/api/v1`, auth requirement, success status                                            |
| Request DTO   | fields, types, `class-validator` rules with explicit bounds and normalization (trim, case), Unicode notes |
| Response DTO  | fields the caller needs, no more; no Prisma types                                                         |
| Errors        | each failure the caller must tell apart: status, error code, when; in the ADR-defined error format        |
| Authorization | who may call, ownership checks, what an outsider gets (403 vs 404)                                        |
| Domain rules  | invariants and state transitions with rule IDs; which module owns them                                    |
| Persistence   | Prisma model changes in the `app` schema, constraints/indexes enforcing invariants, migration notes       |
| Side effects  | outbox events, emails — after commit (AGENTS.md §3.10)                                                    |

Contract first (AGENTS.md §3.11): DTOs and Swagger decorators are designed here; the OpenAPI
document is generated from code. If the project has no OpenAPI generation or error format yet and
this story needs one, say so under Open points if an ADR exists, or return `BLOCKED` naming the
missing decision.

### Design — web

| Section       | Content                                                                                                                                                               |
| ------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Route         | path, route group, Server vs Client parts, redirects                                                                                                                  |
| Components    | tree of feature components in `features/<feature>/`, reused `components/ui` primitives                                                                                |
| Form          | fields, Zod schema mirroring the api rules (cite the api spec), submit behavior                                                                                       |
| UI states     | loading, empty, error, success, disabled — what each shows                                                                                                            |
| Design        | mockup panels used, design README corrections applied, where epic text overrides; app shell only from `general/` (BRD D17); tokens/classes reused, any new one listed |
| Strings       | every new key with `en` and `uk` text                                                                                                                                 |
| BFF and data  | route handlers, api client calls (from the dependency's spec), how each api error is shown, session effects                                                           |
| Accessibility | keyboard path, labels, not color alone, 360 px where BRD D9 requires it                                                                                               |

A web spec never changes the api contract. A gap in it → `BLOCKED`: a backlog amend (`/so:epic <Epic> <feedback>`) adds a new api story and a replacement web story that depends on it.

## Quality bar

- The simplest design that meets the ACs; no options, layers or abstractions the story does not
  need (AGENTS.md §5).
- Every AC traces to a story AC or a clarification decision; nothing new appears without one.
- Reuse what exists: check the code for modules, components, tokens and helpers first.

## Result

`PASS` with `spec.md`; `BLOCKED` for a missing decision, an ADR gap, an api contract gap (web) or
a story too big.
