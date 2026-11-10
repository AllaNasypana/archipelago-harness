---
description: Reject the current human gate and send the story back.
argument-hint: <reason>
---

Use the story-orchestrator Skill to record rejection of the current human gate
(`references/human-gates.md`). Reason (required): $ARGUMENTS

Refuse without a reason or outside a human gate. Route to the gate's `on_reject` stage, invoke no
stage Skill, and finish with the Orchestration Result.
