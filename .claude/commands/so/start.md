---
description: Activate a story and initialize its workflow.
argument-hint: <StoryId, e.g. US-03-01-api>
---

Use the story-orchestrator Skill in `start` mode (`references/start-flow.md`) for story: $ARGUMENTS

Activate only this story, never replace another active one, check its layer dependency, and do
not run any stage. Finish with the Start Result and recommend `/so:next`.
