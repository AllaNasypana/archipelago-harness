# Status Flow — `/so:status`

**Read-only.** No Skill invocation, no state or artifact change.

## Report

- Health: `IDLE`, `HEALTHY`, `WAITING_FOR_HUMAN`, `BLOCKED`, `INCONSISTENT`, `COMPLETED`, `ARCHIVED`.
- Story ID, layer, `depends_on` and its status; catalog status.
- `current_stage`, `previous_stage`, `attempt`, `last_result`.
- Current stage inputs and outputs: path, exists?, version, status; stale inputs.
- Blocking Open Decisions; `TODO`/`TBD` markers in `APPROVED` inputs.
- Pending gate with the artifacts to review and the exact command.
- Blocking issues; non-blocking findings count.
- Git branch and unrelated working-tree changes.
- Next stage and the recommended command.

When `IDLE`: list catalog stories with status `READY`, marking web stories whose api dependency
is not ready, and slices waiting for approval (`status: DRAFT`).

`INCONSISTENT` when: state files disagree; `current_stage` not in `stage_order`; two current
artifacts of one type; a stale input; recorded state contradicts the files on disk.
