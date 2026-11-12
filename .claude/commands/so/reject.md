---
description: Reject the current human gate and send the work back.
argument-hint: '[TARGET-STAGE] <comment>'
---

Use the story-orchestrator Skill to record rejection of the current human gate
(`references/human-gates.md`). Arguments: $ARGUMENTS

The comment is required. An optional first word names a stage from the gate's `reject_targets`;
otherwise route to `on_reject`. Invoke no stage Skill. Finish with the Orchestration Result.
