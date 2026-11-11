# Status Flow — `/so:status`

**Read-only.** No Skill invocation, no state or artifact change.

## Report

- Health: `IDLE`, `HEALTHY`, `WAITING_FOR_HUMAN`, `BLOCKED` or `INCONSISTENT`.
- Epic: ID, status, story counts by status from `backlog.md`.
- Story: ID, layer, risk, `depends_on` and its status.
- `current_stage`, `previous_stage`, `attempt`, `last_result`.
- Current stage inputs and outputs: path, exists?, version, status; stale inputs.
- `OPEN` epic decisions affecting the story; `TODO`/`TBD` in `APPROVED` inputs.
- Pending gate: artifacts to read and the exact commands.
- Blocking issues; non-blocking findings count.
- Git branch and uncommitted changes (report only).
- The recommended next command.

When no story is active: list `READY` stories in backlog order, marking web stories whose api
dependency is not `DONE` and stories with an unfinished earlier story, warn about uncommitted
changes in `apps/` or `packages/`, and recommend the first startable one.

`INCONSISTENT` when: the state file contradicts itself or the files on disk; `current_stage` is
not in `stage-map.yaml`; the backlog marks a story `ACTIVE` that the state does not name (or the
reverse); an input is stale.
