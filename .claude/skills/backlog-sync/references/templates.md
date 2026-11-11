# Backlog Templates

Front matter rules: `docs/workflow/artifact-schema.md`. Timestamps come from the clock at
runtime. Example values are illustrative.

## `docs/stories/epic-03/backlog.md`

```markdown
---
artifact_type: backlog
epic: EPIC-03
version: 1
status: DRAFT
updated_at: <runtime ISO-8601>
produced_by: backlog-sync
inputs:
  - { path: docs/epics/EPIC-03_Goals_Management.md }
  - { path: docs/product/archipelago-business-requirements.md }
  - { path: docs/design/README.md }
---

# EPIC-03 Goals Management — Backlog

<One paragraph: number of stories by layer and risk, what is deferred and why.>

## Stories

| ID                                    | Layer | Title            | Depends on   | Risk   | BRD refs       | Epic refs     | ACs | Status   |
| ------------------------------------- | ----- | ---------------- | ------------ | ------ | -------------- | ------------- | --- | -------- |
| [US-03-01-api](US-03-01-api/story.md) | api   | Create a Goal    | —            | normal | FR-016, BR-009 | GOAL-AC-01…04 | 4   | PROPOSED |
| [US-03-01-web](US-03-01-web/story.md) | web   | Create Goal form | US-03-01-api | normal | FR-016         | GOAL-AC-01…04 | 5   | PROPOSED |

<Short notes on order and dependencies that the table cannot show.> IDs link to story.md;
foundation stories link to `../epic-00/<id>/story.md`.

## Coverage

| Epic AC    | Covered by                 | Note                    |
| ---------- | -------------------------- | ----------------------- |
| GOAL-AC-01 | US-03-01-api, US-03-01-web |                         |
| GOAL-AC-30 | **deferred**               | Could priority (FR-0xx) |

## Open questions

- None. Settled questions are in [decisions.md](decisions.md).
- Needs an ADR: <project-wide convention> — affects US-03-02-api.
```

## `docs/stories/epic-03/decisions.md`

```markdown
---
artifact_type: epic_decisions
epic: EPIC-03
version: 1
updated_at: <runtime ISO-8601>
produced_by: backlog-sync
---

# EPIC-03 — Decisions

### D-03-01 — Goal name uniqueness scope

- **Status:** OPEN
- **Question:** Is a Goal name unique per Project or per Workspace?
- **Decision:**
- **Source:**
- **Affects:** US-03-01-api, US-03-01-web
```

## `docs/stories/epic-03/US-03-01-api/story.md`

```markdown
---
id: US-03-01-api
epic: EPIC-03
layer: api
title: Create a Goal
risk: normal
depends_on: null
brd_refs: [FR-016, BR-009]
epic_refs: [GOAL-AC-01, GOAL-AC-02, GOAL-AC-03, GOAL-AC-04]
version: 1
---

# US-03-01-api — Create a Goal

**As** a signed-in user **I want** to create a Goal inside one of my Projects **so that** I can
plan focus around it.

- **AC-1** Given an Active Project I own, when I submit a valid name and priority, then a Goal is
  created as Active with 0% progress. _(GOAL-AC-01)_
- **AC-2** …

Notes: module `goals`.
```

A web story adds, after its ACs:

```markdown
UI: `docs/design/mockups/epic-03-goals/create-goal.png` (content area only; app shell from
`general/`). Corrections: … Strings: `en` + `uk`.
```
