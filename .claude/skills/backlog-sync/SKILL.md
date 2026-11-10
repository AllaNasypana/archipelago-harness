---
name: backlog-sync
description: >
  Creates and keeps Archipelago's local stories in sync with their source: an approved epic
  story slice (default) or, when configured, GitHub Issues. Writes docs/stories/<id>/story.md and
  owns docs/stories/catalog.yaml. Detects drift between a story and its source without
  overwriting requirements of an active story. Owns the BACKLOG_SYNC stage. Invoked by
  story-orchestrator on /so:slice-approve and on a story_source_conflict loop-back, or directly
  when someone asks to sync the backlog or refresh a story from its slice.
---

# Backlog Sync

Turns approved story definitions into the files the workflow runs on. It copies — it never
writes or edits requirements.

## Read first

| What                                           | Where                                                         |
| ---------------------------------------------- | ------------------------------------------------------------- |
| When this runs (`run_policy`)                  | `docs/workflow/stage-map.yaml` → `BACKLOG_SYNC`               |
| Paths: `story`, `story_catalog`, `story_slice` | `docs/workflow/artifact-paths.yaml`                           |
| `story.md` front matter                        | `docs/workflow/artifact-schema.md` → "Story"                  |
| Catalog format                                 | `docs/workflow/state-schema.md` → `docs/stories/catalog.yaml` |
| Story statuses                                 | `docs/workflow/artifact-lifecycle.md` §4                      |

You write only `story.md` files and `catalog.yaml`. Never `workflow-state.yaml`,
`active-story.yaml`, the slice, or any epic.

## Run policy

Not on routine `/so:next`. Only when:

- **materialize** — `/so:slice-approve <Epic>` delegated by story-orchestrator;
- **refresh** — a `RECONCILIATION` `story_source_conflict` loop-back, or an explicit request to
  re-sync one story or the whole backlog.

## Sources

| Source         | When                                                                             | Authoritative for                   |
| -------------- | -------------------------------------------------------------------------------- | ----------------------------------- |
| `local_slice`  | Default. The newest `APPROVED` slice of the epic.                                | Title, layer, depends_on, refs, ACs |
| `github_issue` | Only if a repository is configured in `.mcp.json` and the human asked to use it. | Same fields                         |

No repository configured → use slices only. Never invent a repository or issue number.

## Mode: materialize (after slice approval)

For each story in the slice's **Stories** table, in table order:

1. Skip it if the ID is already in the catalog — report it as skipped (a new slice version never
   silently rewrites existing stories; use refresh for that).
2. Write `docs/stories/<id>/story.md`:
   - front matter exactly as in `artifact-schema.md`: `id`, `epic`, `layer`, `title`,
     `depends_on`, `brd_refs`, `epic_refs`, and `source` (`type: local_slice`, `slice` path,
     `last_synced_at` runtime);
   - body copied **verbatim** from the story's section in the slice: the user-story sentence,
     the acceptance criteria with their refs, and the notes/UI lines. Change nothing but headings.
3. Add a catalog entry: `id`, `epic`, `layer`, `title`, `status: READY`, `depends_on`, `path`.
   Keep catalog entries sorted by ID.

Then check the catalog: every non-null `depends_on` belongs to a `web` story and points to an
existing `api` story; `api` stories have none; there are no ID duplicates. A broken reference is a `BLOCKED` issue.

## Mode: refresh (one story or all)

Compare each story with its source and classify every difference:

| Class                 | Example                                     | Action when story is `READY` | Action when `ACTIVE`/later |
| --------------------- | ------------------------------------------- | ---------------------------- | -------------------------- |
| `formatting_only`     | whitespace, heading level                   | update                       | update                     |
| `source_changed`      | slice v2 reworded an AC                     | update, report               | **conflict**               |
| `local_edit`          | `story.md` edited by hand, source unchanged | **conflict**                 | **conflict**               |
| `removed_from_source` | story missing from the newest slice         | report; human sets `DROPPED` | **conflict**               |

On a conflict: change neither side, list the differing fields (title, each AC, refs,
depends_on), and return `BLOCKED`. Once a story is `ACTIVE`, its approved specification governs
delivery detail; a requirement change there means a human decision and re-running the stages
from `SPECIFICATION` — report it, do not apply it.

## Catalog status

You set `READY` (new stories) and, only on a human's instruction, `DROPPED`. `ACTIVE`,
`COMPLETED` and `ARCHIVED` are set by story-orchestrator. Never move a story backwards.

## Result envelope

Return the envelope from `artifact-lifecycle.md` §2 with `stage: BACKLOG_SYNC`
(`story: null` in materialize mode):

- `PASS` — files written or confirmed in sync; list every created or updated path.
- `BLOCKED` — conflict or broken dependency; `blocking_issues` names the story and fields.
  `BACKLOG_SYNC` has no loop-backs, so problems are never `CHANGES_REQUIRED`.

Summary for the human: created / updated / skipped stories (ID, layer, title), conflicts, and the
first story that can start (no unmet `depends_on`).

## Never

Rewrite, merge, split or "improve" acceptance criteria; resolve Open Decisions; invent stories;
write GitHub Issues without explicit human approval for that specific change; create branches,
commits or PRs.
