# Slice Approval — `/so:slice-approve <Epic> [comment]`

Records the human approval of a story slice written by `story-slicer`. Works while a story is
active or while `IDLE`; it never changes `workflow-state.yaml`.

## Preconditions

- The `story_slice` for the epic exists (`docs/stories/slices/EPIC-<nn>-slice.md`) with
  `status: DRAFT` and is the newest version.
- Its coverage table maps every epic AC to a story or to an explicit "deferred" / "out of scope"
  entry, and no story breaks the small-story rules (`stage-map.yaml` `pre_workflow`). If not,
  refuse and say what is missing; the human re-runs `/so:slice <Epic> <feedback>`.

## Steps

1. Set the slice `status: APPROVED` and `updated_at` (runtime).
2. Delegate to `backlog-sync` to create each `docs/stories/<id>/story.md` and add the stories to
   `catalog.yaml` with status `READY` (stories already in the catalog are left untouched and
   reported). If `backlog-sync` is not implemented yet, stop after step 1 and say so.
3. Append `{"verdict":"SLICE_APPROVED","story":null,"skill":null,"artifacts":["<slice path>"],"note":"<epic> [comment]",...}`.

## Result

Epic, slice version, stories created (ID, layer, title, depends_on), stories skipped, and the
recommended first story: the earliest `api` story with no dependency, or a foundation story.
