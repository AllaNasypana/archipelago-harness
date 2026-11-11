# Artifact Front-Matter Schema

The YAML front matter of every workflow Markdown artifact. Owners write it, reviewers validate it.
Paths come from `artifact-paths.yaml`, statuses from `artifact-lifecycle.md`.

## Story artifacts

`clarification`, `specification`, `specification_review`, `implementation_plan`, `test_report`,
`implementation_report`, `review`:

```yaml
---
artifact_type: specification # a key from artifact-paths.yaml
story: US-03-02-api
layer: api # copied from the story
version: 1 # +1 per revision
status: DRAFT # DRAFT | APPROVED
updated_at: 2026-11-11T10:00:00Z # illustrative; always from the clock at runtime
produced_by: spec-writer # the registry owner (owner_by_layer for implementation_report)
inputs: # every artifact read, with the version read
  - { path: docs/stories/epic-03/US-03-02-api/story.md, version: 1 }
  - { path: docs/stories/epic-03/US-03-02-api/clarification.md, version: 1 }
  - { path: docs/stories/epic-03/decisions.md, version: 3 }
---
```

| Field      | Rule                                                                                                                                                           |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `story`    | Equals `workflow-state.yaml` `story.id`.                                                                                                                       |
| `version`  | `1` on creation; a run that changes content increments it.                                                                                                     |
| `status`   | Owners write `DRAFT`; `APPROVED` per `artifact-lifecycle.md` §1.                                                                                               |
| `inputs[]` | Every workflow artifact read, with its version. A web story lists its dependency's `spec.md`. Project documents (BRD, epic, ADR) are listed without a version. |

Review artifacts (`specification_review`, `review`) also carry `verdict:` — the same value as the
result envelope.

`specification` also carries `risk: normal | high` — the story's risk after the spec; the
orchestrator raises `story.risk` in state when it is `high` (risk never goes down).

## Story (`story.md`)

Written by `backlog-sync`, amended by `story-clarifier` with the confirmed changes. Its status
lives in `backlog.md`, not here.

```yaml
---
id: US-03-02-api
epic: EPIC-03
layer: api # api | web
title: Create a Goal
risk: normal # normal | high (stage-map.yaml story_rules.risk)
depends_on: null # web only: the api story whose endpoints it calls; null otherwise
brd_refs: [FR-016, BR-009]
epic_refs: [GOAL-AC-01, GOAL-AC-02]
version: 1 # +1 when CLARIFICATION applies changes
---
```

Body: the user story sentence, then 2–5 acceptance criteria (`AC-1` …) in Given/When/Then, each
testable on its own; for `web`, the mockup panels and design corrections that apply.

## Backlog (`backlog.md`)

```yaml
---
artifact_type: backlog
epic: EPIC-03
version: 1
status: DRAFT # APPROVED at HUMAN_BACKLOG_APPROVAL
updated_at: 2026-11-11T09:00:00Z
produced_by: backlog-sync
inputs:
  - { path: docs/epics/EPIC-03_Goals_Management.md }
  - { path: docs/product/archipelago-business-requirements.md }
---
```

Body, in this order:

1. **Stories** — one table in delivery order:
   `ID | Layer | Title | Depends on | Risk | BRD refs | Epic refs | ACs | Status`. Foundation
   stories (`US-00-…`) used by this epic appear here too, linked to their `epic-00` folder.
2. **Coverage** — every epic AC mapped to stories, or marked `deferred` / `out of scope` with
   the reason.
3. **Open questions** — what blocks slicing; resolved ones move to `decisions.md`.

Only the orchestrator edits the Status column after approval, and raises Risk when
`SPECIFICATION` does (`story.md` keeps the risk proposed at slicing).

An amend adds a fourth section, **Amendment**: what changed in this version and a **Drop on
approval** list of `READY` stories it replaces, each with the reason.

## Epic decisions (`decisions.md`)

```yaml
---
artifact_type: epic_decisions
epic: EPIC-03
version: 1
updated_at: 2026-11-11T09:00:00Z
produced_by: backlog-sync
---
```

One entry per decision, never renumbered:

```markdown
### D-03-01 — Goal name uniqueness scope

- **Status:** OPEN | DECIDED
- **Question:** …
- **Decision:** … (empty while OPEN)
- **Source:** human, YYYY-MM-DD, at US-03-02-api CLARIFICATION | BRD BR-009
- **Affects:** US-03-02-api, US-03-02-web
```

A story whose clarification depends on an `OPEN` decision cannot pass `CLARIFICATION`. A decision
that is project-wide (AGENTS.md §5 conventions) is not recorded here: it becomes a proposed ADR.

## Files without front matter

`workflow-state.yaml` and `history.jsonl` follow `state-schema.md`.
