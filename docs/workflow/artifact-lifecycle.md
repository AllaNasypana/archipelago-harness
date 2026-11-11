# Status Vocabularies

The single source of status values used by the harness. Each enum answers a different question;
never mix them.

| Enum            | Question it answers                     | Stored in                               |
| --------------- | --------------------------------------- | --------------------------------------- |
| Artifact status | Is this document agreed?                | `status:` in artifact front matter      |
| Stage verdict   | What did this automated stage decide?   | `verdict` in the result envelope (§2)   |
| Workflow status | Can the workflow move right now?        | `status:` in `workflow-state.yaml`      |
| Epic status     | Where is the active epic?               | `epic.status:` in `workflow-state.yaml` |
| Story status    | Where is a story in its epic's backlog? | Status column of `backlog.md`           |

---

## 1. Artifact status

| Value      | Meaning                                                                    |
| ---------- | -------------------------------------------------------------------------- |
| `DRAFT`    | Written or revised by its owner; no human has accepted this version yet.   |
| `APPROVED` | A human accepted this version (a gate, or the CLARIFICATION confirmation). |

Rules:

- An artifact is revised in place: its owner increments `version` and resets `status: DRAFT`.
  Git keeps the old text; there are no superseded copies.
- On `/so:approve` the orchestrator sets the gate's `required_artifacts` to `APPROVED`; on `DONE`
  it sets every artifact of the story to `APPROVED`. `story-clarifier` sets `clarification` to
  `APPROVED` itself, because the human confirms inside the stage.
- A Skill never changes the status of an artifact it does not own (except the orchestrator as
  above).
- **Staleness:** each artifact lists the versions it read (`artifact-schema.md`). If an input is
  now at a higher version, the artifact is stale. Its owner re-runs and revises it; any other
  stage that consumes it returns `BLOCKED` and names the owner's stage to re-run. A loop-back
  that revises an approved artifact therefore sends the story through that artifact's gate
  again — routing in `stage-map.yaml` already does this.
- **Frozen dependencies:** an artifact of a story that is `DONE` (e.g. `dependency_spec`) is
  frozen. A consumer checks only that it exists and is `APPROVED`, never its own inputs: later
  epic decisions do not make it stale. A new decision that contradicts it is an api contract gap
  (`stage-map.yaml` → `web_depends_on_api`), not staleness.

---

## 2. Stage verdict and the result envelope

Every automated or interactive stage returns one result envelope to the orchestrator:

```yaml
stage: SPEC_REVIEW
skill: spec-reviewer
verdict: PASS # PASS | CHANGES_REQUIRED | BLOCKED
loop_back_key: null # a key under this stage's `loop_back`, only with CHANGES_REQUIRED
artifacts: # what this run wrote
  - {
      type: specification_review,
      path: docs/stories/epic-03/US-03-02-api/spec-review.md,
      version: 1,
    }
blocking_issues: [] # non-empty only with BLOCKED or CHANGES_REQUIRED
non_blocking_findings: 0 # count; the findings stay in the artifact
summary: One or two sentences for the human.
```

| Value              | Meaning                                                                                                                           | Orchestrator action                     |
| ------------------ | --------------------------------------------------------------------------------------------------------------------------------- | --------------------------------------- |
| `PASS`             | Stage goal met; non-blocking findings may exist.                                                                                  | Advance to `next`.                      |
| `CHANGES_REQUIRED` | Correctable problem upstream; `loop_back_key` names a key under this stage's `loop_back`.                                         | Route to the loop-back target.          |
| `BLOCKED`          | Cannot proceed: missing or stale input, open blocking decision, environment failure, or no human confirmation at `CLARIFICATION`. | Hold the stage; show `blocking_issues`. |

`CLARIFICATION` returns its envelope only when the interview ends. An interrupted interview
returns nothing: the state stays `IN_PROGRESS` and the next `/so:next` resumes from
`clarification.md`.

Human gates and `DONE` are **stages**, not verdicts. The history markers (`HUMAN_APPROVED`,
`SKIPPED`, …) are listed in `state-schema.md`.

---

## 3. Workflow status

| Value               | Meaning                                                               |
| ------------------- | --------------------------------------------------------------------- |
| `IDLE`              | Nothing runs: no epic, or an epic `IN_DELIVERY` with no active story. |
| `IN_PROGRESS`       | The current stage is runnable (or resumable) by `/so:next`.           |
| `WAITING_FOR_HUMAN` | The current stage is a human gate; `pending_human_gate` is `PENDING`. |
| `BLOCKED`           | The last stage returned `BLOCKED`, or a workflow invariant failed.    |

`pending_human_gate.status`: `PENDING`, `APPROVED`, `REJECTED`.

---

## 4. Epic status

| Value         | Meaning                                                                 |
| ------------- | ----------------------------------------------------------------------- |
| `BACKLOG`     | `BACKLOG_SYNC` or `HUMAN_BACKLOG_APPROVAL` is current (also an amend).  |
| `IN_DELIVERY` | Backlog approved; stories are activated one at a time with `/so:start`. |
| `DONE`        | Every story is `DONE` or `DROPPED`; an amend can reopen it.             |

---

## 5. Story status

| Value      | Meaning                                                                       |
| ---------- | ----------------------------------------------------------------------------- |
| `PROPOSED` | Written by `BACKLOG_SYNC`; the backlog is not approved yet.                   |
| `READY`    | Backlog approved (or the story was parked); startable per `start-flow.md`.    |
| `ACTIVE`   | The story in the workflow now (at most one).                                  |
| `DONE`     | Accepted at `HUMAN_ACCEPTANCE`.                                               |
| `DROPPED`  | Removed from scope by a human; kept for history with the reason in `backlog`. |
