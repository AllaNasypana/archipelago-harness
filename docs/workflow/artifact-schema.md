# Artifact Front-Matter Schema

The YAML front matter every story-level Markdown artifact carries. Owner Skills must write it;
reviewers must validate it. Paths come from `artifact-paths.yaml`; statuses from
`artifact-lifecycle.md`.

## Produced artifacts

```yaml
---
artifact_type: specification # a key from artifact-paths.yaml
story: US-03-02-api
layer: api # api | web — copied from the story
version: 1 # starts at 1, +1 per revision
status: DRAFT
created_at: 2026-11-09T10:00:00Z # illustrative; always generated at runtime
updated_at: 2026-11-09T10:00:00Z
produced_by: spec-writer # the owner in artifact-paths.yaml
inputs: # every artifact read, with the version read
  - { path: docs/stories/US-03-02-api/story.md, version: 1 }
  - { path: docs/stories/US-03-02-api/open-decisions.md, version: 2 }
supersedes: null # or the path of the replaced version
---
```

| Field                       | Rule                                                                                                                                                          |
| --------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `artifact_type`             | A registry key in `artifact-paths.yaml`.                                                                                                                      |
| `story`                     | Equals `workflow-state.yaml` `story`.                                                                                                                         |
| `layer`                     | Equals the story's `layer`; an artifact with `applies_to` must match it.                                                                                      |
| `version`                   | `1` on creation; a re-run that changes content increments it.                                                                                                 |
| `status`                    | New artifacts start `DRAFT`; later changes are recorded by the orchestrator.                                                                                  |
| `created_at` / `updated_at` | From the system clock at runtime. Dates in Skill examples are labelled illustrative.                                                                          |
| `produced_by`               | The registry `owner` (or the `owner_by_layer` entry for the story's layer).                                                                                   |
| `inputs[]`                  | One entry per consumed artifact or project document with the version read; enables stale-input checks. A web story lists its api dependency's `openapi` here. |
| `supersedes`                | `null`, or the replaced file; that file becomes `SUPERSEDED`.                                                                                                 |

**Staleness:** if an input recorded at `version: N` is now at `N+1`, the artifact is stale and
blocks progression (`verdict: BLOCKED`) until its stage re-runs.

## Story (`story.md`)

Created by `backlog-sync` from an approved slice or a GitHub Issue. It is a workflow **input**,
so it has no `produced_by` / `inputs`. Its backlog status lives in the catalog, not here.

```yaml
---
id: US-03-02-api
epic: EPIC-03
layer: api # api | web
title: Create a Goal
depends_on: null # web only: the api story whose contract it consumes, e.g. US-03-02-api; null = no API contract (pure UI / BFF plumbing). Api stories: always null (table order).
brd_refs: [FR-016, BR-009] # BRD requirement IDs this story delivers
epic_refs: [GOAL-AC-01, GOAL-AC-02] # epic acceptance criteria IDs
source:
  type: local_slice # local_slice | github_issue
  slice: docs/stories/slices/EPIC-03-slice.md
  issue_url: null
  last_synced_at: null
---
```

The body holds the user story sentence and at most ~5 acceptance criteria (`AC-1` …), each
testable on its own (small-story rules in `stage-map.yaml` `pre_workflow`).

## Story slice (`slices/EPIC-<nn>-slice.md`)

```yaml
---
artifact_type: story_slice
epic: EPIC-03
version: 1
status: DRAFT # APPROVED after the human approves the slice
produced_by: story-slicer
created_at: 2026-11-09T10:00:00Z # illustrative
inputs:
  - { path: docs/epics/EPIC-03_Goals_Management.md, version: null }
---
```

The body is one table: `ID | layer | title | depends_on | BRD refs | epic refs | ACs (count)`,
followed by one short section per story with its acceptance criteria.

## OpenAPI contract (`openapi.yaml`)

YAML, not Markdown, so it carries traceability in extension keys instead of front matter:

```yaml
openapi: 3.1.0
info:
  title: Archipelago API — US-03-02-api
  version: '1' # mirrors the paired api_design version
x-story: US-03-02-api
x-source-specification: docs/stories/US-03-02-api/spec.md
x-source-specification-version: 1
x-produced-by: openapi-designer
```

The paired `api_design.md` carries the full front matter and anchors traceability.

## Files without front matter

`story_catalog` (YAML), `workflow_state`, `active_story` and `workflow_history` (JSONL) follow
`state-schema.md`.
