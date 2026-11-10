---
name: story-orchestrator
description: >
  Coordinates Archipelago's artifact-driven story-delivery workflow. Reads workflow state, checks
  invariants, routes the active story to exactly one stage Skill (choosing the api or web
  implementor by story layer), records the transition, and stops at every human gate. Also
  records epic-slice approval. Modes: start, continue, status, archive, slice-approve. Use for
  /so:start, /so:next, /so:status, /so:approve, /so:reject, /so:archive, /so:slice-approve, or
  whenever someone asks to start, resume, inspect or archive a story.
argument-hint: <start|continue|status|archive|slice-approve> [StoryId|Epic]
---

# Story Orchestrator

A state-machine coordinator. It decides **which** stage runs next and **records** what happened.
It never does stage work itself: no clarification, specs, designs, plans, tests, code, reviews
or PR text.

## Canonical sources — read them, never copy them

| Concern                                                                | File                                  |
| ---------------------------------------------------------------------- | ------------------------------------- |
| Stages, order, skills, transitions, loop-backs, gates, layers, slicing | `docs/workflow/stage-map.yaml`        |
| Artifact paths and owners                                              | `docs/workflow/artifact-paths.yaml`   |
| Artifact status, verdicts, result envelope, workflow and story status  | `docs/workflow/artifact-lifecycle.md` |
| Front matter and staleness                                             | `docs/workflow/artifact-schema.md`    |
| State files, history events, catalog                                   | `docs/workflow/state-schema.md`       |
| Project rules                                                          | `AGENTS.md`                           |

This Skill holds no stage list, no stage→skill map and no paths of its own. If anything here
seems to disagree with those files, they win: stop and report the drift.

You write only `docs/workflow/workflow-state.yaml`, `docs/workflow/active-story.yaml`,
`docs/workflow/history.jsonl` (append-only), status fields of artifacts after reviews and gates,
and story status in `docs/stories/catalog.yaml`.

## Modes

Load only the reference for the requested mode. Default is `continue`; never infer `archive`.

| Mode            | Command                     | Reference                      |
| --------------- | --------------------------- | ------------------------------ |
| `start`         | `/so:start <StoryId>`       | `references/start-flow.md`     |
| `continue`      | `/so:next`                  | `references/continue-flow.md`  |
| `status`        | `/so:status`                | `references/status-flow.md`    |
| gate decision   | `/so:approve`, `/so:reject` | `references/human-gates.md`    |
| `archive`       | `/so:archive`               | `references/archive-flow.md`   |
| `slice-approve` | `/so:slice-approve <Epic>`  | `references/slice-approval.md` |

Slicing itself (`/so:slice <Epic>`) runs the `story-slicer` Skill directly; it does not touch
workflow state.

## Single-step rule

One `continue` performs **at most one** transition: resolve state → check invariants → invoke one
Skill or stop at a gate → read its result envelope → record one transition or hold → report.
Never chain stages, recurse, or run a story to the end in one call.

## Routing a stage

1. `stage := stage-map.stages[current_stage]`.
2. Pick the Skill: `stage.skill`, or `stage.skill_by_layer[story.layer]` when present.
3. If `stage.applies_to` exists and does not include the story's layer, invoke nothing: record
   `NOT_APPLICABLE` yourself with `note: "not applicable to layer <layer>"` and move to `next`.
   No artifact is written; downstream stages skip that `conditional_artifacts` key. (When the
   stage applies to the layer but the Specification says the area does not change, the Skill
   runs and writes the one-line `NOT_APPLICABLE` artifact itself.)
4. Resolve every key in `stage.inputs` through `artifact-paths.yaml`:
   - project documents from `project_documents`;
   - for a `web` story with `depends_on`, `openapi` and `api_design` come from that story (none
     when `depends_on` is null)
     (`stage-map.yaml` `layer_dependencies.web.consumes_from_dependency`);
   - a `conditional_artifacts` key whose design stage was `NOT_APPLICABLE` is skipped.
5. Invoke the Skill with: story ID, layer, stage, resolved input paths, and the instruction to
   stay within its responsibility and return the result envelope. Do not paste artifact bodies.

## Applying the result envelope

The envelope format is defined in `artifact-lifecycle.md` §2.

| Verdict            | Check                                                            | Transition                                  |
| ------------------ | ---------------------------------------------------------------- | ------------------------------------------- |
| `PASS`             | Every output exists at its registry path with valid front matter | `next`, `attempt: 1`                        |
| `NOT_APPLICABLE`   | Stage is `optional: true` and the artifact states the reason     | `next`, `attempt: 1`                        |
| `CHANGES_REQUIRED` | `loop_back_key` exists under `stage.loop_back`                   | `loop_back[key]`; `attempt + 1` on a repeat |
| `BLOCKED`          | `blocking_issues` is non-empty                                   | stay; `status: BLOCKED`                     |

- An unknown `loop_back_key`, a missing output, or an unparseable envelope → hold as `BLOCKED`.
- Several findings pointing to different targets → choose the **earliest** stage in
  `stage_order` and say why.
- Never turn `CHANGES_REQUIRED` or `BLOCKED` into progress, and never invent a result.
- After a review stage passes, set the reviewed artifact to `APPROVED` only when no human gate
  follows; otherwise it stays `IN_REVIEW` until the gate is approved.

## Invariants (check before invoking a Skill)

- One active story; `active-story.yaml` and `workflow-state.yaml` name the same story and layer.
- `current_stage` is in `stage_order`.
- Inputs exist, are not `SUPERSEDED`/`ARCHIVED`, and no input is stale (`artifact-schema.md`).
- No unresolved **blocking** Open Decision affects this stage.
- No `TODO`/`TBD`/`FIXME`/`???` left in an `APPROVED` input.
- `web` story with `depends_on`: that story has an `APPROVED` `openapi`; before `COMPLETED`, the
  dependency itself is `COMPLETED`.
- The routed Skill exists in `.claude/skills/`. If it does not exist yet, hold as `BLOCKED` with
  "Skill <name> not implemented" — do not do its work yourself.

On failure: do not route; set `BLOCKED` (or `WAITING_FOR_HUMAN`), name the failed invariant and
the earliest stage or human action that fixes it.

## Idempotency

Before invoking, check whether the stage already has a current, valid output for this story. If
yes, reuse its recorded verdict instead of regenerating. A fresh attempt keeps history: new
`version`, `supersedes` set, previous file `SUPERSEDED`.

## Recording a transition

Update `workflow-state.yaml` exactly as `state-schema.md` describes, then append one event to
`history.jsonl`. Timestamps come from the system clock (`date -u +%Y-%m-%dT%H:%M:%SZ`). Keep state
small: counts and paths, never copied findings. Do not claim a transition you did not write.

## Boundaries

You must not: pass or infer a human gate (a review `PASS` is not approval); resolve Open
Decisions; change requirements; do stage work; invoke more than one stage Skill per call; run
`archive` unasked; delete or move artifacts or history; commit, push, create or merge PRs; run
destructive database commands; bypass hooks; log secrets. Auto Mode never passes a human gate.

## Orchestration Result

Finish every call with this block (paths resolved from the registry):

```
Mode:              continue
Story:             US-03-02-api (api)
Stage:             SPEC_REVIEW → HUMAN_SPEC_APPROVAL
Skill:             spec-verifier
Verdict:           PASS
Artifacts:         docs/stories/US-03-02-api/spec-review.md (v1)
Workflow status:   WAITING_FOR_HUMAN
Human gate:        review spec.md (v1) and spec-review.md (v1); automated verdict PASS
Blocking issues:   none
Next command:      /so:approve or /so:reject <reason>
```
