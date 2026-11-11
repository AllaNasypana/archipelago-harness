---
name: story-orchestrator
description: >
  Coordinates Archipelago's epic-delivery workflow: activates an epic and runs its BACKLOG_SYNC,
  activates one story at a time, routes the active stage to exactly one Skill (the api or web
  implementor by layer), records each transition, and stops at every human gate. Modes: epic,
  start, continue, status, gate decisions. Use for /so:epic, /so:start, /so:next, /so:status,
  /so:approve, /so:reject, or whenever someone asks to start, resume, inspect, approve or reject
  workflow work.
argument-hint: <epic|start|continue|status|approve|reject> [Epic|StoryId|comment]
---

# Story Orchestrator

A state machine. It decides **which** stage runs next and **records** what happened. It never
does stage work: no slicing, clarification, specs, plans, tests, code or reviews.

## Canonical sources — read them, never copy them

| Concern                                                     | File                                  |
| ----------------------------------------------------------- | ------------------------------------- |
| Stages, order, Skills, transitions, loop-backs, gates, risk | `docs/workflow/stage-map.yaml`        |
| Artifact paths, owners, co-writers                          | `docs/workflow/artifact-paths.yaml`   |
| Statuses, verdicts, result envelope                         | `docs/workflow/artifact-lifecycle.md` |
| Front matter, staleness                                     | `docs/workflow/artifact-schema.md`    |
| State file, transition rules, history events                | `docs/workflow/state-schema.md`       |
| What every stage Skill does the same way                    | `docs/workflow/stage-contract.md`     |
| Project rules                                               | `AGENTS.md`                           |

This Skill holds no stage list and no paths of its own. If it seems to disagree with those files,
they win: stop and report the drift.

You write only: `workflow-state.yaml`, `history.jsonl` (append-only), the Status column of
`backlog.md`, and `status` of artifacts after a gate or `DONE` (`artifact-lifecycle.md` §1).

## Modes

Load only the reference for the requested mode. Default is `continue`.

| Mode          | Command                     | Reference                     |
| ------------- | --------------------------- | ----------------------------- |
| `epic`        | `/so:epic <Epic>`           | `references/epic-flow.md`     |
| `start`       | `/so:start <StoryId>`       | `references/start-flow.md`    |
| `continue`    | `/so:next`                  | `references/continue-flow.md` |
| `status`      | `/so:status`                | `references/status-flow.md`   |
| gate decision | `/so:approve`, `/so:reject` | `references/human-gates.md`   |

## Single-step rule

One call performs **at most one** stage: resolve state → check invariants → invoke one Skill or
stop at a gate → read its result envelope → record → report. Never chain stages or run a story to
the end. Two exceptions record two events in one call, because no work happens between them:
skipping a gate whose `required_when` does not hold, and an epic becoming `DONE` with its last
story.

## Routing a stage

1. `stage := epic_stages[current_stage]` or `story_stages[current_stage]` (`stage-map.yaml`).
2. Skill: `stage.skill`, or `stage.skill_by_layer[story.layer]`.
3. Resolve every key in `stage.inputs` through `artifact-paths.yaml`. `dependency_spec` is the
   `specification` of the story in `depends_on`; skip it when there is none.
4. Invoke by stage type:
   - `automated_skill` — run the Skill with: epic, story ID, layer, risk, stage, resolved input
     paths, and the instruction to stay in its responsibility and return the result envelope.
     Do not paste artifact bodies.
   - `fresh_context: true` — run it in a subagent (Agent tool) that loads the Skill, so the
     reviewer has not seen the work being written. Pass the same data.
   - `interactive_skill` — hand the conversation to the Skill in this session; it talks to the
     human across turns and ends by telling them to run `/so:next`. That next call finds
     `clarification.md` with `interview: done`, `status: APPROVED` and current inputs and records
     `PASS` by reuse; a `BLOCKED` envelope is recorded when the Skill returns it. Never in Auto
     Mode.
5. A routed Skill that does not exist in `.claude/skills/` → `BLOCKED` with "Skill <name> not
   implemented". Never do its work yourself.

## Applying the result envelope

| Verdict            | Check                                                        | Transition                                  |
| ------------------ | ------------------------------------------------------------ | ------------------------------------------- |
| `PASS`             | Every output exists at its registry path, front matter valid | `next`, `attempt: 1`                        |
| `CHANGES_REQUIRED` | `loop_back_key` exists under `stage.loop_back`               | `loop_back[key]`; `attempt + 1` on a repeat |
| `BLOCKED`          | `blocking_issues` non-empty                                  | stay; `status: BLOCKED`                     |

- Unknown key, missing output or unparseable envelope → `BLOCKED`.
- Findings pointing to several targets → the earliest stage in `story_stage_order`; say why.
- Never turn `CHANGES_REQUIRED` or `BLOCKED` into progress; never invent a result.
- Entering a gate: see `human-gates.md` (including the `required_when` skip).
- After `SPECIFICATION` passes, read `risk` from `spec.md` front matter; if it is `high`, set
  `story.risk: high` in state (risk only goes up).

## Invariants — check before invoking

- `workflow-state.yaml` is internally consistent: a story implies an epic `IN_DELIVERY`; a gate
  stage implies `pending_human_gate`; `current_stage` exists in `stage-map.yaml`.
- Inputs exist and none is stale (`artifact-schema.md`).
- Story stages: no `OPEN` entry in `decisions.md` lists this story under **Affects**, except at
  `CLARIFICATION`, which resolves them.
- No `TODO`/`TBD`/`FIXME`/`???` in an `APPROVED` input.
- `web` story with `depends_on`: that story is `DONE`.

On failure: invoke nothing, set `BLOCKED`, name the invariant and the stage or human action that
fixes it.

## Idempotency

Before invoking, check whether the stage already has a current output for this story (its
`inputs` versions match the files now). If yes, reuse it instead of regenerating: its `verdict`
for a review, `PASS` for any other output. Revisions are in place: the owner bumps `version` and
resets `status: DRAFT`.

**Never reuse** when the stage was re-entered by a loop-back or a rejection (the last history
event is `CHANGES_REQUIRED` or `HUMAN_REJECTED` with this stage as `to_stage`): the inputs did not
change, but the owner must act on the key or the comment. Run the Skill and pass them.

## Recording

Update `workflow-state.yaml` as `state-schema.md` describes and append one `history.jsonl` event
per change. Timestamps from `date -u +%Y-%m-%dT%H:%M:%SZ`. Keep state small: IDs, counts, paths —
never copied findings. Never claim a transition you did not write.

## Dropping a story

Only on an explicit human instruction naming the story and a reason: set it `DROPPED` in
`backlog.md` with the reason in a note under the table, append an event, and, if it was active,
reset the story as `DONE` does (`state-schema.md` rule 7) without marking it `DONE`.

## Boundaries

Never: pass or infer a human gate (a review `PASS` is not approval); resolve decisions; change
requirements; do stage work; invoke more than one stage Skill per call; delete or move
artifacts or history; commit, push, branch or open PRs (Git after acceptance is open, OQ-8); run
destructive database commands; bypass hooks; log secrets. Auto Mode never passes a gate and
never runs `CLARIFICATION`.

## Orchestration Result

Finish every call with this block (paths from the registry):

```
Mode:              continue
Epic:              EPIC-03 (IN_DELIVERY)
Story:             US-03-02-api (api, risk normal)
Stage:             SPEC_REVIEW → HUMAN_SPEC_APPROVAL
Skill:             spec-reviewer (fresh context)
Verdict:           PASS
Artifacts:         docs/stories/epic-03/US-03-02-api/spec-review.md (v1)
Workflow status:   WAITING_FOR_HUMAN
Human gate:        read spec.md (v1) and spec-review.md (v1); automated verdict PASS
Blocking issues:   none
Next command:      /so:approve [comment] or /so:reject [CLARIFICATION|SPECIFICATION] <comment>
```
