# Slice Template

Copy this structure. Keep it short: tables first, then one compact section per story.

```markdown
---
artifact_type: story_slice
epic: EPIC-03
version: 1
status: DRAFT
produced_by: story-slicer
created_at: <runtime ISO-8601>
updated_at: <runtime ISO-8601>
inputs:
  - { path: docs/epics/EPIC-03_Goals_Management.md, version: null }
  - { path: docs/product/archipelago-business-requirements.md, version: '1.1' }
  - { path: docs/design/README.md, version: null }
supersedes: null
---

# EPIC-03 Goals Management — Story Slice

## Stories

| ID           | Layer | Title            | Depends on   | BRD refs       | Epic refs           | ACs |
| ------------ | ----- | ---------------- | ------------ | -------------- | ------------------- | --- |
| US-03-01-api | api   | Create a Goal    | —            | FR-016, BR-009 | GOAL-AC-01…04       | 4   |
| US-03-01-web | web   | Create Goal form | US-03-01-api | FR-016         | GOAL-AC-01…04, UI-… | 5   |

## Coverage

| Epic AC    | Covered by                 | Note                    |
| ---------- | -------------------------- | ----------------------- |
| GOAL-AC-01 | US-03-01-api, US-03-01-web |                         |
| GOAL-AC-30 | deferred                   | Could priority (FR-0xx) |

## Open questions

- None. / Q1: <question> — affects US-03-04-web.

## US-03-01-api — Create a Goal

**As** a signed-in user **I want** to create a Goal inside one of my Projects **so that** I can
plan focus around it.

- **AC-1** Given an Active Project I own, when I submit a valid name and priority, then a Goal is
  created as Active with 0% progress. _(GOAL-AC-01, BR-…)_
- **AC-2** …

Notes: module `goals`; endpoint shape decided in API_DESIGN, not here.

## US-03-01-web — Create Goal form

**As** … **I want** … **so that** …

- **AC-1** …

UI: `docs/design/mockups/epic-03-goals/create-goal.png` (content area only; app shell from
`general/`). Corrections: … Strings: `en` + `uk`.
```
