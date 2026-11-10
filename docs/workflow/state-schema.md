# Workflow State Schema

Schema of the mutable harness files. Stage Skills never write them: they return a result envelope
(`artifact-lifecycle.md` §2) and `story-orchestrator` records the transition.

| File                                | Writer                                                      |
| ----------------------------------- | ----------------------------------------------------------- |
| `docs/workflow/active-story.yaml`   | `story-orchestrator` only                                   |
| `docs/workflow/workflow-state.yaml` | `story-orchestrator` only                                   |
| `docs/workflow/history.jsonl`       | `story-orchestrator` only, append-only                      |
| `docs/stories/catalog.yaml`         | `backlog-sync`; status changes mirrored by the orchestrator |

Keep these files short. Findings, evidence and reasoning belong in the stage artifacts; state
files hold only identifiers, statuses, counts and paths.

---

## `active-story.yaml`

```yaml
version: 1
active_story: US-03-02-web # or null when idle
layer: web # api | web | null
depends_on: US-03-02-api # or null
story_path: docs/stories/US-03-02-web/story.md
activated_at: 2026-11-09T10:00:00Z # illustrative
activated_by: human
```

Rules:

- At most one active story. A value that differs from `workflow-state.yaml` `story` is an
  inconsistent state and blocks `continue`.
- A `web` story with `depends_on` is activated only if that story has an `APPROVED` `openapi`.

---

## `workflow-state.yaml`

```yaml
version: 1
workflow: story-delivery
story: US-03-02-web # null when IDLE
layer: web
status: IN_PROGRESS # artifact-lifecycle.md §3
current_stage: UI_DESIGN # a stage-map.yaml id, or null when IDLE
previous_stage: DB_DESIGN
attempt: 1 # runs of current_stage in a row, >= 1
last_result: # null before the first stage
  stage: DB_DESIGN
  skill: db-designer
  verdict: NOT_APPLICABLE
  recorded_at: 2026-11-09T10:05:00Z
  artifacts:
    - { type: database_design, path: docs/stories/US-03-02-web/db-design.md, version: 1 }
pending_human_gate: null # see below
blocking_issues: [] # short strings, only when BLOCKED
non_blocking_findings: 0 # running count; details stay in artifacts
started_at: 2026-11-09T10:00:00Z
updated_at: 2026-11-09T10:05:00Z
completed_at: null
archived_at: null
```

### `pending_human_gate`

Non-null exactly when `current_stage` is a human gate.

```yaml
pending_human_gate:
  stage: HUMAN_PLAN_APPROVAL
  status: PENDING # PENDING | APPROVED | REJECTED
  required_artifacts:
    - {
        type: implementation_plan,
        path: docs/stories/US-03-02-web/implementation-plan.md,
        version: 1,
      }
    - { type: plan_review, path: docs/stories/US-03-02-web/plan-review.md, version: 1 }
  automated_verdict: PASS # verdict of the review feeding this gate
  requested_at: 2026-11-09T11:00:00Z
  decided_at: null
  decided_by: null # set by /so:approve or /so:reject
  comment: null
```

### Transition rules

1. Only `story-orchestrator` changes this file, and only after a stage result or a human decision.
2. Every change appends exactly one event to `history.jsonl`.
3. `current_stage` is always in `stage-map.yaml` `stage_order` (or `null` when `IDLE`).
4. `PASS` / `NOT_APPLICABLE` → `next`, `attempt: 1`. `CHANGES_REQUIRED` → the `loop_back` target;
   `attempt` grows when the same stage repeats. `BLOCKED` → stay, `status: BLOCKED`.
5. Entering a human gate sets `status: WAITING_FOR_HUMAN` and fills `pending_human_gate`.
   `/so:approve` → `on_approve`; `/so:reject` → `on_reject`.
6. A review Skill's `PASS` is never treated as human approval.
7. A `web` story cannot move to `COMPLETED` until its `depends_on` story is `COMPLETED`.

---

## `history.jsonl`

One JSON object per line, append-only, never rewritten.

```json
{
  "timestamp": "2026-11-09T10:05:00Z",
  "story": "US-03-02-web",
  "from_stage": "DB_DESIGN",
  "to_stage": "UI_DESIGN",
  "skill": "db-designer",
  "verdict": "NOT_APPLICABLE",
  "artifacts": ["docs/stories/US-03-02-web/db-design.md"],
  "attempt": 1,
  "note": null
}
```

`verdict` is a review verdict or a lifecycle marker: `ACTIVATED`, `HUMAN_APPROVED`,
`HUMAN_REJECTED`, `SLICE_APPROVED` (epic slice; `story: null`), `ARCHIVED`. For human decisions `skill` is `null` and `note` holds the comment
(and any Open Decision resolutions, which must also be published in `open_decisions`).

---

## `docs/stories/catalog.yaml`

```yaml
version: 1
stories:
  - id: US-03-02-api
    epic: EPIC-03
    layer: api
    title: Create a Goal
    status: COMPLETED # artifact-lifecycle.md §4
    depends_on: null
    path: docs/stories/US-03-02-api/story.md
  - id: US-03-02-web
    epic: EPIC-03
    layer: web
    title: Create Goal form
    status: ACTIVE
    depends_on: US-03-02-api
    path: docs/stories/US-03-02-web/story.md
```
