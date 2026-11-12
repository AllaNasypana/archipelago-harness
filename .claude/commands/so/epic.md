---
description: Activate an epic and cut it into small api/web stories (BACKLOG_SYNC).
argument-hint: <Epic, e.g. EPIC-03>
---

Use the story-orchestrator Skill in `epic` mode (`references/epic-flow.md`) for: $ARGUMENTS

Never replace an epic that is not DONE. Activation needs a clean tree on `dev` and creates the
local epic branch (`docs/workflow/stage-map.yaml` → `git`). With feedback on an approved backlog, amend it (park a
BLOCKED active story first). Run at most the BACKLOG_SYNC stage, then stop at
HUMAN_BACKLOG_APPROVAL. Finish with the Orchestration Result.
