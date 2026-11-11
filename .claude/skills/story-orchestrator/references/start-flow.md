# Start Flow — `/so:start <StoryId>`

Activate one story. Runs no stage.

## Preconditions

- Epic `IN_DELIVERY`, no active story (`story: null`). Another active story → stop and ask; never
  replace it.
- The story is listed in the active epic's `backlog.md` with status `READY` (a `US-00` story
  counts when this backlog lists it), and its `story.md` exists.
- `web` story with `depends_on`: that story is `DONE` in whichever backlog lists it. Otherwise
  stop and name the api story to deliver first.

## Steps

1. Read `layer`, `risk` and `depends_on` from the story front matter.
2. Set `story: {id, layer, risk, depends_on, path, base_commit, activated_at}` (`base_commit` =
   `git rev-parse --short HEAD`; uncommitted changes outside the story are reported as a warning), `current_stage: CLARIFICATION`,
   `previous_stage: null`, `attempt: 1`, `status: IN_PROGRESS`, other story fields empty.
3. Set the story `ACTIVE` in `backlog.md`.
4. Append `{"verdict":"ACTIVATED","from_stage":null,"to_stage":"CLARIFICATION","skill":null,...}`.

Never initialize at a later stage than `CLARIFICATION`.

## Result

The Orchestration Result: story, layer, risk (and whether `HUMAN_PLAN_APPROVAL` will apply),
dependency status, current Git branch (report only), and the next command `/so:next`, which
starts the clarification interview.
