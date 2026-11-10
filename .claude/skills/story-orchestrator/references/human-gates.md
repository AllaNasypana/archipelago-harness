# Human Gates — `/so:approve`, `/so:reject`

Gates are the stages with `type: human_gate` in `stage-map.yaml`. No Skill runs at a gate; only a
human command moves it.

## Entering a gate

Build `pending_human_gate` (`state-schema.md`):

- `stage`, `status: PENDING`, `requested_at` (runtime);
- `required_artifacts` from `stage-map.yaml`, each resolved to `{type, path, version}`;
- `automated_verdict` of the review that fed the gate.

Set `status: WAITING_FOR_HUMAN` and report the artifacts to read (paths + versions), the
automated verdict, open non-blocking findings count, and the two commands.

## `/so:approve [comment]`

Refuse unless `current_stage` is a human gate and every required artifact exists, is current, and
its review verdict was `PASS`.

1. `pending_human_gate`: `status: APPROVED`, `decided_at` (runtime), `decided_by`, `comment`.
2. Set the gate's reviewed artifacts to `APPROVED` (e.g. `specification` at
   `HUMAN_SPEC_APPROVAL`, `implementation_plan` at `HUMAN_PLAN_APPROVAL`).
3. If the human resolved Open Decisions in the comment, record them in the history `note` and
   tell the human that `us-clarifier` must publish them in a new `open_decisions` version before
   the next stage consumes it.
4. Append `{"verdict":"HUMAN_APPROVED","skill":null,...}`.
5. Move to `on_approve`; clear `pending_human_gate`; status `IN_PROGRESS`, or `COMPLETED` /
   `ARCHIVED` when entering those stages.
6. At `COMPLETED` for a `web` story, refuse if its `depends_on` story is not `COMPLETED`.

## `/so:reject <reason>`

The reason is required. Refuse unless `current_stage` is a human gate.

1. `pending_human_gate`: `status: REJECTED`, `decided_at`, `decided_by`, `comment: <reason>`.
2. Append `{"verdict":"HUMAN_REJECTED","skill":null,"note":"<reason>",...}`.
3. Move to `on_reject`; clear `pending_human_gate`; `status: IN_PROGRESS`.

Both commands invoke no stage Skill and never create, push or merge a PR. Finish with the
Orchestration Result, including the target stage and the next command.
