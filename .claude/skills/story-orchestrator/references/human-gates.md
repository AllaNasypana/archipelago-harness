# Human Gates — `/so:approve`, `/so:reject`

Gates are stages with `type: human_gate` in `stage-map.yaml`. No Skill runs at a gate; only a
human command moves it.

## Entering a gate

1. **`required_when`.** If the gate has one and it does not hold (e.g. `HUMAN_PLAN_APPROVAL` with
   `story.risk: normal`), do not stop: append `{"verdict":"SKIPPED",...}` and move to
   `on_approve`.
2. Otherwise build `pending_human_gate` (`state-schema.md`): `stage`, `status: PENDING`,
   `required_artifacts` resolved to `{type, path, version}`, `automated_verdict` of the review that
   fed it (or `null`), `requested_at`. Set `status: WAITING_FOR_HUMAN`.
3. Report what to read (paths + versions), the automated verdict, non-blocking findings count,
   and the commands, including `reject_targets` if the gate has them.

## `/so:approve [comment]`

Refuse unless `current_stage` is a human gate and every required artifact exists and is current.
For `HUMAN_BACKLOG_APPROVAL` also check that every story `backlog.md` lists has its `story.md`.
At `HUMAN_SPEC_APPROVAL` and `HUMAN_ACCEPTANCE` also refuse unless the feeding review's verdict
was `PASS`.

1. `pending_human_gate`: `status: APPROVED`, `decided_at`, `decided_by`, `comment`.
2. Set the gate's `required_artifacts` to `APPROVED`. Artifacts without a `status` field
   (`story`, `epic_decisions`) are never written: a story's status lives in the `backlog.md`
   Status column (`HUMAN_BACKLOG_APPROVAL` → `READY`, see `epic-flow.md`).
3. Append `{"verdict":"HUMAN_APPROVED","skill":null,"note":"<comment>",...}` (`BACKLOG_APPROVED` at
   `HUMAN_BACKLOG_APPROVAL`; one event either way).
4. Clear `pending_human_gate` and move to `on_approve`:
   - `HUMAN_BACKLOG_APPROVAL` → effects in `epic-flow.md`.
   - `HUMAN_ACCEPTANCE` → `DONE`: set every story artifact `APPROVED`, the story `DONE` in
     `backlog.md`, append `DONE`, reset the story (`state-schema.md` rule 7), check epic done
     (`epic-flow.md`), and list the next `READY` stories — especially a web story this api story
     unblocked.
   - otherwise `status: IN_PROGRESS`.

A comment that decides a product question is not applied by you: tell the human it will be
recorded at the next `CLARIFICATION`, or reject to `CLARIFICATION` now.

## `/so:reject [TARGET] <comment>`

The comment is required. Refuse unless `current_stage` is a human gate.

1. If the first word is a stage ID, it must be in the gate's `reject_targets`; otherwise refuse
   and list them. No stage ID → `on_reject`.
2. `pending_human_gate`: `status: REJECTED`, `decided_at`, `decided_by`, `comment`.
3. Append `{"verdict":"HUMAN_REJECTED","skill":null,"note":"<comment>",...}`.
4. Clear `pending_human_gate`, move to the target, `status: IN_PROGRESS`. The target's owner gets
   the comment on the next `/so:next` and revises its artifact in place (`version + 1`, `DRAFT`),
   so every later gate is passed again.

Both commands invoke no stage Skill and never touch Git. Finish with the Orchestration Result,
including the target stage and the next command.
