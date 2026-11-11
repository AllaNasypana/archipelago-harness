# Epic Flow — `/so:epic <Epic> [feedback]`

Activate an epic, or amend its approved backlog, and run its one automated stage,
`BACKLOG_SYNC`.

## Preconditions

- **Activate:** no active epic, or the active epic is `DONE`. Another epic `BACKLOG` or
  `IN_DELIVERY` → stop and ask; never replace it.
- **Amend** (feedback given, the epic's `backlog.md` is `APPROVED`): the epic is the active one
  `IN_DELIVERY`, or it is `DONE` and no other epic is active (it is reopened). No active story,
  or the active story is `BLOCKED` — park it first (below). An active story that is not
  `BLOCKED` → stop and ask.
- `docs/epics/EPIC-<nn>_*.md` exists. Otherwise stop and say so.

## Steps

1. Set `epic: {id, status: BACKLOG, backlog: <backlog path>, activated_at}`, `story: null`,
   `current_stage: BACKLOG_SYNC`, `status: IN_PROGRESS`. Append `EPIC_ACTIVATED`.
2. **Reuse.** If `backlog.md` already exists with `status: DRAFT` and no feedback was given
   (e.g. a migrated backlog), do not run the Skill: treat it as `BACKLOG_SYNC` `PASS` with that
   file as output.
   If it exists `APPROVED` and no feedback was given, the epic was approved before: set
   `epic.status: IN_DELIVERY`, `current_stage: null`, `status: IDLE`, report the `READY`
   stories, and stop.
3. Otherwise invoke `backlog-sync` — mode `new`; `revise` with the feedback on a `DRAFT` backlog;
   `amend` with the feedback on an `APPROVED` one — and apply its envelope (SKILL.md). An amend
   records `BACKLOG_AMEND` (note: the feedback) instead of `EPIC_ACTIVATED` and keeps
   `activated_at`.
4. On `PASS` enter `HUMAN_BACKLOG_APPROVAL` (`human-gates.md`): the human reviews `backlog.md` and
   the story files.

## Approving the backlog

Handled by `/so:approve` (`human-gates.md`), with these effects:

- `backlog.md` and every story it lists with `PROPOSED` → backlog `status: APPROVED`, those
  stories `READY` in the Status column. Stories under **Amendment → Drop on approval** →
  `DROPPED`, with the reason in a note under the table.
- `epic.status: IN_DELIVERY`, `current_stage: null`, `status: IDLE`. The approval is one history
  event with verdict `BACKLOG_APPROVED` (instead of `HUMAN_APPROVED`).
- Recommend the first story: the earliest `READY` story in table order whose `depends_on` is
  `DONE` or empty.

Rejection (`/so:reject <feedback>`) goes back to `BACKLOG_SYNC`; the next `/so:next` runs
`backlog-sync` in `revise` mode with that feedback (`amend` again if the backlog was approved
before this round).

## Parking a blocked story

Before an amend, a `BLOCKED` active story is parked: set it `READY` in `backlog.md`, append
`{"verdict":"PARKED","note":"<blocking issue>",...}`, and reset the story as `state-schema.md`
rule 7 does, without `DONE`. Its artifacts stay; a later `/so:start` begins at `CLARIFICATION`
and reuses whatever is still current.

## Epic done

When `DONE` is reached for a story and every story in the backlog is `DONE` or `DROPPED`, set
`epic.status: DONE` and append `EPIC_DONE`. The next `/so:epic` may then activate another epic.
