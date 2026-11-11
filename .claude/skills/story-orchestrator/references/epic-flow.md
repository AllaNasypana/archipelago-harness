# Epic Flow — `/so:epic <Epic> [feedback]`

Activate an epic and run its one automated stage, `BACKLOG_SYNC`.

## Preconditions

- No active epic, or the active epic is `DONE`. Another epic `BACKLOG` or `IN_DELIVERY` → stop
  and ask; never replace it.
- `docs/epics/EPIC-<nn>_*.md` exists. Otherwise stop and say so.

## Steps

1. Set `epic: {id, status: BACKLOG, backlog: <backlog path>, activated_at}`, `story: null`,
   `current_stage: BACKLOG_SYNC`, `status: IN_PROGRESS`. Append `EPIC_ACTIVATED`.
2. **Reuse.** If `backlog.md` already exists with `status: DRAFT` and no feedback was given
   (e.g. a migrated backlog), do not run the Skill: treat it as `BACKLOG_SYNC` `PASS` with that
   file as output.
   If it exists `APPROVED`, the epic was approved before: set `epic.status: IN_DELIVERY`,
   `current_stage: null`, `status: IDLE`, report the `READY` stories, and stop.
3. Otherwise invoke `backlog-sync` (mode `new`, or `revise` with the feedback) and apply its
   envelope (SKILL.md).
4. On `PASS` enter `HUMAN_BACKLOG_APPROVAL` (`human-gates.md`): the human reviews `backlog.md` and
   the story files.

## Approving the backlog

Handled by `/so:approve` (`human-gates.md`), with these effects:

- `backlog.md` and every story it lists with `PROPOSED` → backlog `status: APPROVED`, those
  stories `READY` in the Status column.
- `epic.status: IN_DELIVERY`, `current_stage: null`, `status: IDLE`. The approval is one history
  event with verdict `BACKLOG_APPROVED` (instead of `HUMAN_APPROVED`).
- Recommend the first story: the earliest `READY` story in table order whose `depends_on` is
  `DONE` or empty.

Rejection (`/so:reject <feedback>`) goes back to `BACKLOG_SYNC`; the next `/so:next` runs
`backlog-sync` in `revise` mode with that feedback.

## Epic done

When `DONE` is reached for a story and every story in the backlog is `DONE` or `DROPPED`, set
`epic.status: DONE` and append `EPIC_DONE`. The next `/so:epic` may then activate another epic.
