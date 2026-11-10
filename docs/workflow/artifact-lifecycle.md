# Status Vocabularies

The single source of status values used by the harness. There are four separate enums; they
answer different questions and must never be mixed.

| Enum                      | Question it answers                   | Where it is stored                                            |
| ------------------------- | ------------------------------------- | ------------------------------------------------------------- |
| Artifact lifecycle status | Is this document current?             | `status:` in the artifact front matter (`artifact-schema.md`) |
| Review verdict            | What did this automated stage decide? | `verdict` in the stage result envelope (§2)                   |
| Workflow status           | What state is the delivery in?        | `status:` in `workflow-state.yaml`                            |
| Story status              | Where is the story in the backlog?    | `status:` per story in `docs/stories/catalog.yaml`            |

---

## 1. Artifact lifecycle status

| Value        | Meaning                                                                 |
| ------------ | ----------------------------------------------------------------------- |
| `DRAFT`      | Written by its owner Skill; not reviewed yet.                           |
| `IN_REVIEW`  | A downstream review stage is evaluating it.                             |
| `APPROVED`   | Passed its review (and human gate where there is one). Safe to consume. |
| `SUPERSEDED` | A newer version exists; never used as a current input.                  |
| `ARCHIVED`   | Belongs to an archived delivery; kept for history only.                 |

Rules:

- A revision increments `version` and sets `supersedes`; the previous file becomes `SUPERSEDED`.
- Reviewers check that every input they read is current (not `SUPERSEDED`/`ARCHIVED`) and that
  the versions recorded downstream match. A stale input blocks progression until the dependent
  stage re-runs.
- Status changes after a review or human gate are recorded by `story-orchestrator`; a Skill never
  edits the status of an artifact it does not own.
- Open Decisions resolved at a human gate are written into a new version of `open_decisions` by
  its owner (`us-clarifier`) before the next stage consumes them — the resolution must live in the
  artifact, not only in `history.jsonl`.

---

## 2. Review verdict and the result envelope

Every automated stage returns one result envelope to the orchestrator:

```yaml
stage: SPEC_REVIEW
skill: spec-verifier
verdict: PASS # PASS | CHANGES_REQUIRED | BLOCKED | NOT_APPLICABLE
loop_back_key: null # a key under this stage's `loop_back` in stage-map.yaml, only with CHANGES_REQUIRED
artifacts: # what this run wrote
  - { type: specification_review, path: docs/stories/US-03-02-api/spec-review.md, version: 1 }
blocking_issues: [] # non-empty only with BLOCKED or CHANGES_REQUIRED
non_blocking_findings: 0 # count; the findings themselves stay in the artifact
summary: One or two sentences for the human.
```

| Value              | Meaning                                                                                         | Orchestrator action                     |
| ------------------ | ----------------------------------------------------------------------------------------------- | --------------------------------------- |
| `PASS`             | Stage goal met; no blocking findings (non-blocking ones may exist).                             | Advance to `next`.                      |
| `CHANGES_REQUIRED` | Correctable problem; `loop_back_key` names a key under this stage's `loop_back`.                | Route to the loop-back target.          |
| `BLOCKED`          | Cannot be evaluated: missing or stale input, unresolved blocking decision, environment failure. | Hold the stage; show `blocking_issues`. |
| `NOT_APPLICABLE`   | Only for `optional: true` stages whose condition is met; the reason is in the artifact.         | Advance to `next`.                      |

`READY_FOR_PR`, `COMPLETED` and `ARCHIVED` are **stages**, not verdicts. Verdict names from
older harnesses (`APPROVED`, `REJECTED`, `FAILED`, `PROCEED_TO_*`, `RETURN_TO_*`, …) are not used.

---

## 3. Workflow status

Stored in `workflow-state.yaml`.

| Value               | Meaning                                                                  |
| ------------------- | ------------------------------------------------------------------------ |
| `IDLE`              | No story is active.                                                      |
| `NOT_STARTED`       | A story was activated; no stage has run yet.                             |
| `IN_PROGRESS`       | The current stage is automated and runnable.                             |
| `WAITING_FOR_HUMAN` | The current stage is a human gate; `pending_human_gate.status: PENDING`. |
| `BLOCKED`           | The last stage returned `BLOCKED`, or a workflow invariant failed.       |
| `COMPLETED`         | Stage `COMPLETED` reached: the PR is merged or the delivery was closed.  |
| `ARCHIVED`          | Stage `ARCHIVED` reached through archive mode.                           |

`pending_human_gate.status`: `PENDING`, `APPROVED`, `REJECTED`.

---

## 4. Story status

Stored per story in `docs/stories/catalog.yaml` (and as `PROPOSED` rows in a `story_slice`).

| Value       | Meaning                                                                            |
| ----------- | ---------------------------------------------------------------------------------- |
| `PROPOSED`  | Listed in a story slice that a human has not approved yet.                         |
| `READY`     | Slice approved and `story.md` created; may be activated (dependencies permitting). |
| `ACTIVE`    | The story currently in the workflow (exactly one at a time).                       |
| `COMPLETED` | Its PR is merged.                                                                  |
| `ARCHIVED`  | Archive mode finished.                                                             |
| `DROPPED`   | Removed from scope by a human; kept for history.                                   |

A `web` story becomes activatable only when its `depends_on` api story has an `APPROVED`
`openapi` artifact (`stage-map.yaml` `layer_dependencies`).
