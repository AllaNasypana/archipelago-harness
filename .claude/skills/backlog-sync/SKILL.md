---
name: backlog-sync
description: >
  Cuts one Archipelago epic (docs/epics/EPIC-<nn>_*.md) into small single-layer user stories —
  api (NestJS) or web (Next.js) — and writes the epic backlog: docs/stories/epic-<nn>/backlog.md,
  decisions.md and one story.md per story. Owns the epic-level BACKLOG_SYNC stage. Invoked by
  story-orchestrator on /so:epic <Epic> and when HUMAN_BACKLOG_APPROVAL is rejected with
  feedback. Use when someone asks to slice, split or break down an epic into stories, or to
  rework an epic backlog ("наріж епік", "розбий EPIC-03 на сторі", "переглянь беклог").
argument-hint: <Epic, e.g. EPIC-03> [feedback for a new version]
---

# Backlog Sync

Turns one epic into a backlog a human approves in a few minutes: small stories in delivery
order, each with exactly one layer, every epic AC accounted for. You write only the epic's
`backlog.md`, `decisions.md` and `story.md` files. Never workflow state, the epic, the BRD or
an ADR.

## Read first

| What                                 | Where                                                                      |
| ------------------------------------ | -------------------------------------------------------------------------- |
| Story rules: size, layers, risk, IDs | `docs/workflow/stage-map.yaml` → `story_rules`, `epic_stages.BACKLOG_SYNC` |
| Paths                                | `docs/workflow/artifact-paths.yaml` → `backlog`, `epic_decisions`, `story` |
| Front matter and body formats        | `docs/workflow/artifact-schema.md`; templates in `references/templates.md` |
| The epic                             | its ACs, flows, screen inventory, open items, revision log                 |
| Requirement IDs                      | BRD FR/BR/NFR with `Phase: EPIC-<nn>`                                      |
| UI references and corrections        | `docs/design/README.md`                                                    |
| Boundaries                           | `AGENTS.md` §3–5, `apps/api/AGENTS.md`, `apps/web/AGENTS.md`               |
| Accepted / proposed decisions        | `docs/adr/`                                                                |
| Existing stories (never reuse an ID) | every `docs/stories/epic-*/backlog.md`, especially `epic-00` foundation    |

## Modes

- **new** — no `backlog.md` for the epic yet: write everything at `version: 1`.
- **revise** — the human rejected the backlog with feedback: apply exactly that feedback, bump
  `version` of each file you change, keep IDs of unchanged stories stable, and list what changed
  at the top of your summary. A story that already left `PROPOSED` is never rewritten; report the
  requested change instead.

## How to slice

1. **List capabilities.** Group the epic's ACs by user-visible behavior: create, edit, archive,
   list/filter, detail, error and edge states.
2. **Split by layer.**
   - `api`: domain rules, use case, Prisma `app`, REST endpoint, regenerated client. Server-side
     validation, authorization and invariants always land here, written once.
   - `web`: route, components, form with the Zod mirror, hooks, BFF route handler, UI states,
     `en`/`uk` strings, mockup panels. It refers to api rules ("mirrors BR-009") instead of
     restating them.
   - Usually a pair with one number: `US-03-02-api`, then `US-03-02-web` with `depends_on`.
     A web story without an api call has `depends_on: null`; api stories never have one.
3. **Make each story small** (`story_rules.small`). Too big → split by state, by operation, or
   write vs read. A justified exception (e.g. one Unit of Work across modules) is stated in the
   story's Notes.
4. **Order for delivery.** A story never depends on a later one; prerequisites first.
5. **Foundation.** Work no epic owns (app shell, i18n, session plumbing, Unit of Work) gets a
   `US-00-<nn>-<layer>` ID and a folder under `docs/stories/epic-00/`. Propose it only if a story
   in this epic needs it and no backlog already has it. It is listed and tracked in this epic's
   backlog.
6. **Risk.** Propose `risk: high` for every story matching `story_rules.risk.high_when`, else
   `normal`. The human confirms it at the gate.
7. **Write each story** (template): user-story sentence, 2–5 ACs in Given/When/Then with refs,
   Notes (module or feature folder, exceptions) and, for web, the mockup panels and corrections.
   ACs state observable behavior, never implementation — endpoint shapes and libraries are
   decided at `SPECIFICATION` / `PLANNING`.
8. **Prove coverage.** Every epic AC is mapped to stories, or marked `deferred` / `out of scope`
   with a reason. A missing row means the backlog is not done.
9. **Decisions.** Product questions the epic leaves open go to `decisions.md` as `OPEN`, each
   naming the stories it affects; answers the human already gave are `DECIDED` with the date.
   Project-wide conventions (error format, pagination, IDs, dates, logging) are not product
   decisions: list them under "Open questions" in `backlog.md` as "needs an ADR".

## Quality checks before returning

- One layer per story; no api story mentions pages or components, no web story changes NestJS
  code or the `app` schema.
- IDs unique across all backlogs, format `US-<epic>-<nn>-<layer>`; titles short and verb-first.
- Every `depends_on` points to an earlier `api` story; no cycles.
- Each AC is testable on its own; no story has more than 5.
- Tables first, details after: a person reads the backlog in a few minutes.

## Result

Return the envelope from `docs/workflow/artifact-lifecycle.md` §2 with `stage: BACKLOG_SYNC`,
`story: null`:

- `PASS` — files written, coverage complete; list every path created or changed.
- `BLOCKED` — the epic is missing, or has open items that make slicing guesswork; name them.

Then tell the human, in their language: stories by layer and risk, the first stories to build,
deferred items, `OPEN` decisions, and the next command: `/so:approve` or
`/so:reject <feedback>`.

## Never

Invent requirements, limits or fields (mockups and placeholders are not requirements); resolve
a product question yourself; edit the epic, BRD or ADRs; touch workflow state; rewrite a story
that is no longer `PROPOSED`.
