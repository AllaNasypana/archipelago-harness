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
3. Report what to read (paths + versions, plus the gate's `also_review`), the automated verdict,
   non-blocking findings count,
   and the commands, including `reject_targets` if the gate has them.

## `/so:approve [comment]`

Refuse unless `current_stage` is a human gate and every required artifact exists and is current
(no higher input `version`, no changed project-document `commit`); a stale one → run `/so:next`,
which routes back.
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
   - `HUMAN_ACCEPTANCE` → `DONE`: apply the review's **Promote** items (below), set every story
     artifact `APPROVED`, the story `DONE` in `backlog.md`, append `DONE`, reset the story
     (`state-schema.md` rule 8), check epic done (`epic-flow.md`), **commit** (below), and list
     the next `READY` stories — especially a web story this api story unblocked.
   - otherwise `status: IN_PROGRESS`.

### Promote at acceptance

`review.md` → **Promote** lists conventions this story settled that later stories must follow,
each with the target file (`apps/<layer>/docs/<layer>-patterns.md`, `AGENTS.md`) and the exact
text. Approving the story approves them: insert each text verbatim at the named place. A comment
that names items to skip (`no promote`, `skip P2`) excludes them. A convention that needs an ADR is
never promoted: the review names it as an ADR to propose.

### Commit at acceptance

One commit per accepted story, on the **current branch** (decided OQ-8, 2026-11-12):

1. If the current branch is the default branch (`main`), do not commit: say so and leave the
   tree as is; the human moves the work to a branch.
2. Stage the story's changes only: `git add -A -- apps packages docs/stories docs/workflow` plus
   any pattern file a Promote item changed. Anything else changed in the tree is listed for the
   human and not committed.
3. Message: `feat(<layer>): <story title> (<StoryId>)`, a body with the AC IDs and the review
   verdict, and the session's commit attribution trailer if one is configured.
4. Never `--no-verify`. A failing hook: report it; the story stays `DONE`, the tree stays dirty,
   and `/so:start` refuses until the human fixes and commits.

A comment that decides a product question is not applied by you: tell the human it will be
recorded at the next `CLARIFICATION`, or reject to `CLARIFICATION` now.

## `/so:reject [TARGET] <comment>`

The comment is required. Refuse unless `current_stage` is a human gate.

1. If the first word is a stage ID, it must be in the gate's `reject_targets`; otherwise refuse
   and list them. No stage ID → `on_reject`.
2. `pending_human_gate`: `status: REJECTED`, `decided_at`, `decided_by`, `comment`.
3. Append `{"verdict":"HUMAN_REJECTED","skill":null,"note":"<comment>",...}`.
4. Set `last_result` (`stage` = the gate, `verdict: HUMAN_REJECTED`, `comment`). Clear
   `pending_human_gate`, move to the target, `status: IN_PROGRESS`. The target's owner gets
   the comment as its re-entry on the next `/so:next` and revises its artifact in place (`version + 1`, `DRAFT`),
   so every later gate is passed again.

Both commands invoke no stage Skill; only `/so:approve` at `HUMAN_ACCEPTANCE` touches Git, with
the one commit above. Finish with the Orchestration Result,
including the target stage and the next command.
