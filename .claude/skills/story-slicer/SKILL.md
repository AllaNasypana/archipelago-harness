---
name: story-slicer
description: >
  Cuts one approved Archipelago epic (docs/epics/EPIC-0X_*.md) into small, independently
  deliverable user stories, each with exactly one layer — api (NestJS) or web (Next.js) — and
  writes the proposed list as a story slice for human approval. Owns the epic-level
  STORY_SLICING step that runs before the per-story workflow. Use for /so:slice <Epic>, or when
  someone asks to split, slice, break down or plan an epic into stories ("наріж епік",
  "розбий EPIC-03 на сторі").
argument-hint: <Epic, e.g. EPIC-03> [feedback for a new version]
---

# Story Slicer

Turns one approved epic into a **slice**: a reviewed-by-human list of small stories. It writes
only the `story_slice` artifact. It never creates `story.md` files, never touches the catalog or
workflow state, and never changes the epic. Approval and story creation happen later through
`/so:slice-approve` (story-orchestrator → backlog-sync).

## Read first

| What                                 | Where                                                                                   |
| ------------------------------------ | --------------------------------------------------------------------------------------- |
| Small-story rules, ID format, layers | `docs/workflow/stage-map.yaml` → `pre_workflow`, `layers`, `layer_dependencies`         |
| Slice path and front matter          | `docs/workflow/artifact-paths.yaml` (`story_slice`), `docs/workflow/artifact-schema.md` |
| The epic                             | `docs/epics/EPIC-<nn>_*.md` — its ACs, flows, screen inventory, revision log            |
| Requirement IDs and priorities       | `docs/product/archipelago-business-requirements.md` (FR/BR/NFR with `Phase: EPIC-<nn>`) |
| UI references and corrections        | `docs/design/README.md`                                                                 |
| Architecture boundaries              | `AGENTS.md` §3–4 (api modules, web features, BFF)                                       |
| Existing stories                     | `docs/stories/catalog.yaml` and earlier slices — never reuse an ID                      |

If the epic or BRD has unresolved items that change what a story must do, list them under
"Open questions" in the slice instead of guessing.

## How to slice

1. **List the epic's capabilities.** Group its ACs (e.g. `GOAL-AC-01…45`) by user-visible
   behavior: create, edit, archive, list/filter, detail, error and edge states.
2. **Split each capability by layer.**
   - `api`: domain rules, use case, Prisma (`app`), REST endpoint, OpenAPI, regenerated client.
     Server-side validation, authorization and invariants always land here.
   - `web`: page/route, components, form with Zod mirror, hooks, BFF route handler, UI states,
     `en`/`uk` strings, mockup panels from the design index.
   - Usually a pair with the same number: `US-03-02-api` then `US-03-02-web` (`depends_on`).
   - Purely backend capabilities (outbox, email delivery) or purely UI ones (layout, shell) are
     single stories.
3. **Make each story small** (rules in `pre_workflow.small_story_rules`). Over ~5 ACs, more than
   one module/feature, or too big to review in one sitting → split again: happy path first, then
   validation/errors, then edge states; or by operation (create / edit / archive); or write vs read.
4. **Order the slice.** Numbers follow delivery order. A story never depends on a later one.
   Put shared prerequisites first.
5. **Foundation work no epic owns** (app shell layout, i18n setup, BFF session plumbing, shared
   Prisma setup) gets IDs `US-00-<nn>-<layer>`. Propose it only when a story in this slice needs
   it and it does not exist yet in the catalog.
6. **Write each story** as defined in `references/slice-template.md`: user story sentence,
   2–5 acceptance criteria in Given/When/Then, epic AC refs, BRD refs, `depends_on`, and for web
   stories the mockup panels and corrections to apply.
7. **Prove coverage.** Every epic AC appears in the coverage table — mapped to one or more
   stories, or marked `deferred` / `out of scope` with the reason (e.g. Could-priority FR, post-MVP).
   Missing rows mean the slice is not done.

## Quality checks before returning

- Each story has exactly one `layer`; no api story mentions pages or components, no web story
  changes NestJS code or the `app` schema.
- Each AC is testable on its own and states observable behavior, not implementation.
- Business rules are written once, on the api story; the web story refers to them ("mirrors
  BR-009 for fast feedback").
- IDs are unique against the catalog and follow `US-<epic>-<nn>-<layer>`.
- Titles are short and verb-first ("Create a Goal", "Goal list filters").
- The whole slice is readable by a person in a few minutes: tables first, details after.

## Output

Write `docs/stories/slices/EPIC-<nn>-slice.md` with the front matter from `artifact-schema.md`
(`status: DRAFT`, runtime timestamps). If a slice already exists, write a new version: bump
`version`, set `supersedes`, mark the old one `SUPERSEDED`, and apply the human's feedback.

Return the result envelope (`artifact-lifecycle.md` §2) with `stage: STORY_SLICING`:

- `PASS` — slice written; coverage complete.
- `BLOCKED` — the epic is not approved, missing, or has open items that make slicing guesswork;
  list them in `blocking_issues`.

Then tell the human, in their language: number of stories by layer, the first stories to build,
deferred items, open questions, and the command `/so:slice-approve EPIC-<nn>` (or
`/so:slice EPIC-<nn> <feedback>` for a new version).
