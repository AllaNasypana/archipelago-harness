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
rule 8 does, without `DONE`. Its artifacts stay; a later `/so:start` begins at `CLARIFICATION`
and reuses whatever is still current. Its uncommitted code and tests in `apps/` or `packages/`
would block the next `/so:start` (clean tree): ask the human to stash them
(`git stash push -u -m "<StoryId> parked" -- apps packages`) and put the stash name in the
`PARKED` note; never stash or discard yourself.

## Restarting an epic

Only on the human's explicit instruction (e.g. after the harness changed): re-slice an epic whose
backlog was approved, keeping delivered work.

1. No active story (park a `BLOCKED` one first).
2. Keep `DONE` / `DROPPED` rows and their `story.md`. Every other story goes back to `PROPOSED`
   and its `story.md` is removed (`git rm`); artifacts of `DONE` stories may be removed only if
   no unfinished story depends on them (`artifact-lifecycle.md` §1). Agreements in removed
   artifacts that later stories need are promoted to the pattern files or an ADR first.
3. `backlog.md`: `version + 1`, `status: DRAFT`, a short "Re-slice pending" note.
4. `history.jsonl` may start fresh (the old one stays in Git; name its commit in the first note):
   `EPIC_ACTIVATED` to `HUMAN_BACKLOG_APPROVAL`, then `HUMAN_REJECTED` to `BACKLOG_SYNC` with the
   human's re-slice feedback as `note`. This is the one exception to append-only.
5. State: `epic.status: BACKLOG`, `current_stage: BACKLOG_SYNC`, `status: IN_PROGRESS`,
   `last_result` = that rejection with the feedback as `comment`. The next `/so:run` runs
   `backlog-sync` in `revise` mode.

## Epic done

When `DONE` is reached for a story and every story in the backlog is `DONE` or `DROPPED`, set
`epic.status: DONE` and append `EPIC_DONE`. The next `/so:epic` may then activate another epic.
