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

| What                                 | Where                                                                          |
| ------------------------------------ | ------------------------------------------------------------------------------ |
| Story rules: size, layers, risk, IDs | `docs/workflow/stage-map.yaml` → `story_rules`, `epic_stages.BACKLOG_SYNC`     |
| Paths                                | `docs/workflow/artifact-paths.yaml` → `backlog`, `epic_decisions`, `story`     |
| Front matter and body formats        | `docs/workflow/artifact-schema.md`; templates in `references/templates.md`     |
| The epic                             | its ACs, flows, screen inventory, open items, revision log                     |
| Requirement IDs                      | BRD FR/BR/NFR with `Phase: EPIC-<nn>`                                          |
| Product scope (lowest precedence)    | PRD §4 MVP scope and Excluded / Later, §14 journeys, §17 release sequence      |
| UI references and corrections        | `docs/design/README.md`                                                        |
| Boundaries                           | `AGENTS.md` §3–5, `apps/api/AGENTS.md`, `apps/web/AGENTS.md`                   |
| Accepted / proposed decisions        | `docs/adr/`                                                                    |
| Existing stories (never reuse an ID) | every `docs/stories/epic-*/backlog.md`, especially `epic-00` foundation        |
| Carry-over from other epics          | every `docs/stories/epic-*/decisions.md` entry with **Hands off to** this epic |

## Modes

- **new** — no `backlog.md` for the epic yet: write everything at `version: 1`.
- **revise** — the human rejected the backlog with feedback: apply exactly that feedback, bump
  `version` of each file you change, keep IDs of unchanged stories stable, and list what changed
  at the top of your summary. A story that already left `PROPOSED` is never rewritten; report the
  requested change instead.

- **amend** — the backlog is `APPROVED` and the human asks for a change during delivery: a split
  proposed at `CLARIFICATION`, a new api story for a contract gap, deferred stories that are now
  unblocked, fix stories named by `EPIC_REVIEW` or a rejected epic acceptance. Add new stories as `PROPOSED` with new IDs (next free `<nn>`, never reused), placed
  before the stories that need them; update coverage; bump `version`, `status: DRAFT`. A `READY`
  story the change replaces goes under **Amendment → Drop on approval** with the reason (the
  orchestrator drops it on approval). Never edit a story that is `READY`, `ACTIVE`, `DONE` or
  `DROPPED`. A contract gap: add the new api story, put the blocked web story under **Drop on
  approval**, and add a replacement web story (new ID, `depends_on` the new api story) that
  carries its ACs over.

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
8. **Carry-over.** Every decision in another epic's `decisions.md` that hands off to this epic
   is part of this backlog: deferred ACs become stories here (epic refs keep the source IDs, e.g.
   `EPIC-01 ONB-AC-07`, plus the decision ID), constraints shape the stories they name. Never
   edit the other epic's files.
9. **Prove coverage.** Every epic AC is mapped to stories, or marked `deferred` / `out of scope`
   with a reason, and every carry-over is mapped under **Carried over**. A missing row means the
   backlog is not done.
10. **Decisions.** Product questions the epic leaves open go to `decisions.md` as `OPEN`, each
    naming the stories it affects; answers the human already gave are `DECIDED` with the date.
    Project-wide conventions (error format, pagination, IDs, dates, logging) are not product
    decisions: list them under "Open questions" in `backlog.md` as "needs an ADR".
11. **PRD drift.** Never slice a capability the PRD lists as Excluded / Later unless the BRD or
    the epic requires it. Where the PRD contradicts the BRD or the epic, the higher source wins
    (AGENTS.md §5.1); list each case under "Open questions" as "PRD drift: <PRD §> vs <rule ID>"
    for the owner to fix the PRD. It does not block slicing.

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
