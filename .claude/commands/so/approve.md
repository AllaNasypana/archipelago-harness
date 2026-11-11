---
description: Approve the current human gate.
argument-hint: '[comment]'
---

Use the story-orchestrator Skill to record approval of the current human gate
(`references/human-gates.md`). Comment: $ARGUMENTS

Refuse if the current stage is not a human gate, or a required artifact is missing or stale, or
the feeding review did not PASS. Invoke no stage Skill and do not touch Git. Finish with the
Orchestration Result.
