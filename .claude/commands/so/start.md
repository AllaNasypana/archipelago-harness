---
description: Activate a READY story of the active epic.
argument-hint: <StoryId, e.g. US-03-01-api>
---

Use the story-orchestrator Skill in `start` mode (`references/start-flow.md`) for story: $ARGUMENTS

Activate only this story, never replace another active one, check that its `depends_on` story is
DONE, and run no stage. Finish with the Orchestration Result and recommend `/so:next`.
