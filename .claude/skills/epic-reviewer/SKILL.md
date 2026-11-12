---
name: epic-reviewer
description: >
  Independently reviews a whole Archipelago epic before it merges into dev: runs the full checks
  on the epic branch, checks that every epic AC is delivered or explicitly deferred, that the
  stories fit together, that settled conventions were promoted, and that the merge into dev is
  clean; writes epic-review.md with a verdict. Owns the EPIC_REVIEW stage; runs in a fresh
  subagent. Invoked by story-orchestrator when every story of the epic is DONE or DROPPED.
argument-hint: <Epic, e.g. EPIC-03>
---

# Epic Reviewer

Each story was reviewed alone; you review what they add up to. Follow
`docs/workflow/stage-contract.md` (it applies to this epic stage too). You write only
`epic-review.md`; you never fix code, stories or the backlog.

## Inputs

`backlog`, the epic's `decisions.md`, the epic, the BRD, the PRD, Accepted ADRs, `agents_rules`
and both lists of `layer_rules`. The diff of the epic: `git diff <base_branch>...HEAD` on the epic
branch (`workflow-state.yaml` → `epic.branch`, `stage-map.yaml` → `git.base_branch`), and
`git log --oneline <base_branch>..HEAD` (one commit per story, plus `fix(harness)` commits). Read a
story's `story.md`, `spec.md` or `review.md` only to check a finding; they are frozen.

## 1. Run the checks

On the epic branch, from the repo root; record command, exit code and trimmed output:

```bash
git status --porcelain                       # must be empty
pnpm db:up
pnpm --filter @archipelago/api prisma:generate
pnpm turbo run lint typecheck test build
pnpm --filter @archipelago/api test:int
pnpm --filter @archipelago/api test:e2e
git fetch origin
git merge-tree --write-tree origin/dev HEAD  # merge preview: conflicts?
```

If `origin/dev` does not exist yet, preview against the local `dev`. A check that cannot run is
reported as not run, with the reason — never as passed.

## 2. Review

| Part       | Check                                                                                                                                                                |
| ---------- | -------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Delivery   | Every epic AC in the backlog Coverage table is delivered by a `DONE` story, or marked deferred / out of scope with a reason; every `DROPPED` story has its reason    |
| Carry-over | Every **Carried over** item is mapped; every decision this epic hands off (`Hands off to`) names the receiving epic                                                  |
| Decisions  | No `OPEN` entry in `decisions.md`; no "needs an ADR" item left without a Proposed or Accepted ADR                                                                    |
| Fit        | Stories work together: web calls match the merged api, routes and redirects link up, no duplicated helper, schema or style across stories, migrations apply in order |
| Commits    | One `feat(<layer>): … (<StoryId>)` commit per `DONE` story (`stage-map.yaml` → `git.story_commit`); nothing uncommitted; no commit outside the epic's scope          |
| Promotion  | Conventions the stories settled are in `apps/<layer>/docs/<layer>-patterns.md`, `AGENTS.md` or an ADR, not only in story artifacts                                   |
| Security   | Across the whole diff: BFF boundary, cookies, authorization, `app`/`bff` isolation, secrets, never-log list (AGENTS.md §3, §7)                                       |
| Merge      | The preview against `dev` is clean                                                                                                                                   |

## `epic-review.md`

Front matter per `artifact-schema.md` → Epic review (`reviewed_commit` = `git rev-parse
--short=12 HEAD`, `base_commit` = the `dev` commit previewed against). Body:

```markdown
## Verdict

PASS | CHANGES_REQUIRED | BLOCKED — one sentence.

## Checks

| Command | Exit | Result |

## Epic AC delivery

| Epic AC | Story | Status |

## Findings

| # | Severity | Part | Where | Finding | Fix (a story to add, or the human action) |

## For the human

What to look at before merging, residual risks, follow-ups for the next epics.
```

## Verdict

- `PASS` — checks pass, every epic AC accounted for, merge preview clean, no blocking findings.
- `CHANGES_REQUIRED` + `backlog_gap` — something must be built or fixed: name each fix or missing
  story in `blocking_issues`; `backlog-sync` amends the backlog with them.
- `BLOCKED` — the checks cannot run, the tree is dirty, or the merge preview conflicts (the human
  resolves it; the epic branch is never rebased by the harness).
