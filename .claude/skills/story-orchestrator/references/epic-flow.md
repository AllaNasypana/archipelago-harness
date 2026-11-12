# Epic Flow — `/so:epic <Epic> [feedback]`

Activate an epic on its own branch, or amend its approved backlog, and run `BACKLOG_SYNC`; close
the epic with `EPIC_REVIEW` and `HUMAN_EPIC_ACCEPTANCE`, which merge it into `dev`. Git names and
rules: `stage-map.yaml` → `git`.

## Preconditions

- **Activate:** no active epic, or the active epic is `DONE`. Another epic `BACKLOG` or
  `IN_DELIVERY` → stop and ask; never replace it.
- **Amend** (feedback given, the epic's `backlog.md` is `APPROVED`): the epic is the active one
  `IN_DELIVERY` or `REVIEW` (fix stories from `EPIC_REVIEW` or a rejected epic acceptance), or it
  is `DONE` and no other epic is active (it is reopened on a new epic branch). No active story,
  or the active story is `BLOCKED` — park it first (below). An active story that is not
  `BLOCKED` → stop and ask.
- `docs/epics/EPIC-<nn>_*.md` exists. Otherwise stop and say so.
- **Git, to activate or reopen:** `git status --porcelain` is empty and the current branch is
  `dev`. Run `git fetch origin`; if `origin/dev` exists and `dev` is behind it,
  `git merge --ff-only origin/dev`; if they diverged, stop and ask. The epic branch
  (`epic/<nn>-<slug>`) must not exist yet; if it does, stop and ask. An amend of the active epic
  needs the current branch to be `epic.branch`.

## Steps

1. Activate or reopen: `git switch -c epic/<nn>-<slug> dev` (slug rule in `stage-map.yaml` →
   `git.slug`). Set `epic: {id, status: BACKLOG, backlog: <backlog path>, branch, activated_at}`,
   `story: null`, `current_stage: BACKLOG_SYNC`, `status: IN_PROGRESS`. Append `EPIC_ACTIVATED`
   (note: the branch). The state change is committed with the first story.
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
5. State: `epic.status: BACKLOG`, `epic.branch` (create the branch as in Steps 1 if there is
   none), `current_stage: BACKLOG_SYNC`, `status: IN_PROGRESS`,
   `last_result` = that rejection with the feedback as `comment`. The next `/so:run` runs
   `backlog-sync` in `revise` mode.

## Epic review

When `DONE` is reached for a story and every story in the backlog is `DONE` or `DROPPED` (after
that story's commit): set `epic.status: REVIEW`, `current_stage: EPIC_REVIEW`,
`status: IN_PROGRESS`, and append `EPIC_REVIEW_STARTED`. `/so:run` (or `/so:next`) runs
`epic-reviewer` in a fresh subagent like any automated stage; `PASS` enters
`HUMAN_EPIC_ACCEPTANCE`. `CHANGES_REQUIRED` + `backlog_gap` goes to `BACKLOG_SYNC` in `amend`
mode with the blocking issues as feedback: `epic.status: BACKLOG`, the new stories are delivered
as usual on the same branch, and the epic comes back here when they are `DONE`.

## Accepting the epic — `/so:approve` at `HUMAN_EPIC_ACCEPTANCE`

Refuse unless the tree is clean, the current branch is `epic.branch`, `epic-review.md` has
`verdict: PASS`, and `git rev-parse --short=12 HEAD` equals its `reviewed_commit`. Then, in
order; stop at the first failure and report the exact command left for the human:

1. **Pre-check, nothing changed yet.** `git fetch origin`. If `origin/dev` exists and `dev` is
   behind it, it must fast-forward (`git merge-base --is-ancestor dev origin/dev`); diverged →
   stop. `git merge-tree --write-tree <origin/dev or dev> HEAD` must report no conflict; a
   conflict → `status: BLOCKED` ("merge conflict with dev"), stop: the human resolves it on the
   epic branch, then `/so:run` re-runs `EPIC_REVIEW`.
2. **Close the epic on its branch.** `epic-review.md` → `status: APPROVED`; `epic.status: DONE`,
   `current_stage: null`, `status: IDLE`, `pending_human_gate: null`; append `EPIC_ACCEPTED`
   (note: the comment) and `EPIC_DONE`. Commit: `git add -A -- docs/stories docs/workflow`,
   message `chore(harness): accept <EPIC-nn>` (`git.epic_accept_commit`).
3. **Merge.** `git switch dev`; if `origin/dev` moved, `git merge --ff-only origin/dev`; then
   `git merge --no-ff epic/<nn>-<slug>` with the subject and body from `git.epic_merge`. No
   commit is ever made on `dev` itself; the merge commit is the only new one there.
4. **Push.** `git push origin dev` (`-u` the first time). The approval is the human's
   authorization for this push. A rejected push → stop; never force.
5. **Clean up.** `git branch -d epic/<nn>-<slug>` (safe delete: it is merged).

If step 3 or later fails, the epic is `DONE` on its branch but not merged: report it with the
exact remaining commands; `/so:status` shows it (`status-flow.md`).

The next `/so:epic` may then activate another epic from `dev`.

Rejection (`/so:reject <comment>`) → `BACKLOG_SYNC` in `amend` mode with the comment as feedback.
