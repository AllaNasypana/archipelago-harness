---
description: Approve the current human gate.
argument-hint: '[comment]'
---

Use the story-orchestrator Skill to record approval of the current human gate
(`references/human-gates.md`). Comment: $ARGUMENTS

Refuse if the current stage is not a human gate or a required artifact is missing, stale or not
PASS. Invoke no stage Skill; never create or merge a PR. Finish with the Orchestration Result.
