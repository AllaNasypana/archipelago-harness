# Start Flow — `/so:start <StoryId>`

Activate one story and initialize its state. Does not run any stage.

## Preconditions

- `workflow-state.yaml` `status` is `IDLE`, `COMPLETED` or `ARCHIVED` (no other active story).
  If another story is active, stop and ask the human; never replace it.
- The story is in `docs/stories/catalog.yaml` with status `READY`.
- Its `story.md` exists at the `story` registry path. If it exists only in an approved
  `story_slice` or a GitHub Issue, delegate to `backlog-sync` to create it first.
- `web` story with `depends_on`: that story's `openapi` artifact is `APPROVED`. Otherwise stop and name
  the api story to deliver first.

## Steps

1. Read `layer` and `depends_on` from the story front matter.
2. Write `active-story.yaml` (`state-schema.md`): story ID, layer, depends_on, story path,
   `activated_at` (runtime), `activated_by`.
3. Write `workflow-state.yaml`: `story`, `layer`, `status: NOT_STARTED`,
   `current_stage: CLARIFICATION`, `previous_stage: BACKLOG_SYNC`, `attempt: 1`, other fields empty.
4. Set the story to `ACTIVE` in the catalog.
5. Append `{"verdict":"ACTIVATED","from_stage":null,"to_stage":"CLARIFICATION","skill":null,...}`.

Never initialize at a later stage than `CLARIFICATION`.

## Branch

Report the current Git branch. Recommend a branch named after the story
(`feat/US-03-02-api-create-goal`) if on `main`; do not create or switch branches unless asked.

## Result

Activated story and layer, dependency status, initial stage, branch, blockers, and the next
command: `/so:next`.
