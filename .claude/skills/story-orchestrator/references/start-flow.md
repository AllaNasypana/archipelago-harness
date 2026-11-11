# Start Flow — `/so:start <StoryId>`

Activate one story. Runs no stage.

## Preconditions

- Epic `IN_DELIVERY`, no active story (`story: null`). Another active story → stop and ask; never
  replace it.
- The story is listed in the active epic's `backlog.md` with status `READY` (a `US-00` story
  counts when this backlog lists it), and its `story.md` exists.
- `web` story with `depends_on`: that story is `DONE` in whichever backlog lists it. Otherwise
  stop and name the api story to deliver first.
- Delivery order: every story above it in the backlog table is `DONE` or `DROPPED` (this is
  how foundation stories come first). Otherwise list them and ask the human to confirm starting
  out of order (never in Auto Mode); record the confirmation in the `ACTIVATED` event's `note`.
- Clean code tree: `git status --porcelain -- apps packages` is empty, so `base_commit` diffs
  only this story. Otherwise stop: the human commits or stashes that work first (how accepted
  work reaches Git is OQ-8).

## Steps

1. Read `layer` and `depends_on` from the story front matter, and `risk` from the backlog Risk
   column (it may have been raised after slicing).
2. Set `story: {id, layer, risk, depends_on, path, base_commit, activated_at}` (`base_commit` =
   `git rev-parse --short HEAD`), `current_stage: CLARIFICATION`,
   `previous_stage: null`, `attempt: 1`, `status: IN_PROGRESS`, other story fields empty.
3. Set the story `ACTIVE` in `backlog.md`.
4. Append `{"verdict":"ACTIVATED","from_stage":null,"to_stage":"CLARIFICATION","skill":null,...}`.

Never initialize at a later stage than `CLARIFICATION`.

## Result

The Orchestration Result: story, layer, risk (and whether `HUMAN_PLAN_APPROVAL` will apply),
dependency status, current Git branch (report only), and the next command `/so:next`, which
starts the clarification interview.
