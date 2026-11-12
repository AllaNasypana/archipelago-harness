# Workflow State Schema

Schema of the mutable harness files. Stage Skills never write them: they return a result envelope
(`artifact-lifecycle.md`) and `story-orchestrator` records the transition.

| File                                | Writer                                 |
| ----------------------------------- | -------------------------------------- |
| `docs/workflow/workflow-state.yaml` | `story-orchestrator` only              |
| `docs/workflow/history.jsonl`       | `story-orchestrator` only, append-only |

Story statuses live in the epic's `backlog.md` (`artifact-paths.yaml`), not here. Keep state
short: identifiers, statuses, counts and paths. Findings and reasoning belong in artifacts.

---

## `workflow-state.yaml`

One active epic, at most one active story inside it.

```yaml
version: 2
epic: # null when no epic is active
  id: EPIC-03
  status: IN_DELIVERY # see Epic status
  backlog: docs/stories/epic-03/backlog.md
  activated_at: 2026-11-11T09:00:00Z
story: # null between stories
  id: US-03-02-web
  layer: web
  risk: normal # normal | high
  depends_on: US-03-02-api # or null
  path: docs/stories/epic-03/US-03-02-web/story.md
  base_commit: e9c4b12 # HEAD at /so:start; REVIEW diffs the story against it
  activated_at: 2026-11-11T10:00:00Z
status: IN_PROGRESS # see Workflow status
current_stage: PLANNING # epic_stages or story_stage_order id; null when nothing runs
previous_stage: HUMAN_SPEC_APPROVAL
attempt: 1 # runs of current_stage in a row, >= 1
last_result: # null before the first stage
  stage: HUMAN_SPEC_APPROVAL
  verdict: HUMAN_APPROVED
  recorded_at: 2026-11-11T11:00:00Z
  artifacts:
    - { type: specification, path: docs/stories/epic-03/US-03-02-web/spec.md, version: 2 }
  loop_back_key: null # with CHANGES_REQUIRED: the key from the envelope
  blocking_issues: [] # with CHANGES_REQUIRED: copied from the envelope (the target's to-do list)
  comment: null # with HUMAN_APPROVED / HUMAN_REJECTED: the human's comment
pending_human_gate: null # see below
blocking_issues: [] # short strings, only when BLOCKED
non_blocking_findings: 0 # running count for the active story
updated_at: 2026-11-11T11:00:00Z
```

`epic.status` and `status` use the epic and workflow status enums in
[`artifact-lifecycle.md`](artifact-lifecycle.md).

### `pending_human_gate`

Non-null exactly when `current_stage` is a human gate.

```yaml
pending_human_gate:
  stage: HUMAN_PLAN_APPROVAL
  status: PENDING # PENDING | APPROVED | REJECTED
  required_artifacts:
    - { type: implementation_plan, path: docs/stories/epic-03/US-03-02-web/plan.md, version: 1 }
  automated_verdict: null # verdict of the review feeding this gate, if any
  requested_at: 2026-11-11T11:30:00Z
  decided_at: null
  decided_by: null
  comment: null
```

### Transition rules

1. Only `story-orchestrator` changes this file, after a stage result or a human command, and
   appends exactly one event to `history.jsonl` per change.
2. `/so:epic` needs no active epic, or one that is `DONE`; with feedback it amends the active
   epic's (or a `DONE` epic's) approved backlog (`epic-flow.md`). `/so:start` needs an epic
   `IN_DELIVERY`, no active story, a story `READY` in its backlog (or a `US-00` story it lists),
   for a `web` story with `depends_on` that story `DONE`, every earlier story in the table `DONE`
   or `DROPPED` (or the human's confirmation), and a clean `apps/` + `packages/` tree.
3. `PASS` → `next`, `attempt: 1`. `CHANGES_REQUIRED` → the `loop_back` target; `attempt` grows
   when the same stage repeats; `last_result` keeps the key and `blocking_issues` so the target's
   owner receives them (`stage-contract.md` → Invocation). `BLOCKED` → stay, `status: BLOCKED`.
4. A gate with `required_when` that does not hold is skipped: one history event with verdict
   `SKIPPED`, then the gate's `on_approve`.
5. Entering a human gate sets `WAITING_FOR_HUMAN` and fills `pending_human_gate`. `/so:approve`
   → `on_approve`; `/so:reject` → `on_reject` or a listed `reject_targets` stage.
6. A stale artifact of the active story (`artifact-lifecycle.md` §1) moves `current_stage` back
   to the earliest stage whose output is stale: one `STALE_INPUT` event, never forward.
7. A review `PASS` is never human approval. Auto Mode never passes a gate or runs `CLARIFICATION`.
8. Reaching `DONE` sets the story `DONE` in `backlog.md` and resets `story`, `current_stage`,
   `previous_stage`, `last_result`, `blocking_issues` and `non_blocking_findings`; `status: IDLE`.

---

## `history.jsonl`

One JSON object per line, append-only, never rewritten — except an epic restart the human orders
(`epic-flow.md` → Restarting an epic).

```json
{
  "timestamp": "2026-11-11T11:00:00Z",
  "epic": "EPIC-03",
  "story": "US-03-02-web",
  "from_stage": "SPEC_REVIEW",
  "to_stage": "HUMAN_SPEC_APPROVAL",
  "skill": "spec-reviewer",
  "verdict": "PASS",
  "artifacts": ["docs/stories/epic-03/US-03-02-web/spec-review.md"],
  "attempt": 1,
  "note": null
}
```

`verdict` is a stage verdict or a lifecycle marker: `EPIC_ACTIVATED`, `BACKLOG_APPROVED`,
`ACTIVATED`, `HUMAN_APPROVED`, `HUMAN_REJECTED`, `SKIPPED`, `DONE`, `EPIC_DONE`, `BACKLOG_AMEND`,
`PARKED`, `CONTINUED`, `STALE_INPUT`. Epic-stage
events have `story: null`. For human decisions `skill` is `null` and `note` holds the comment.
