---
description: Approve the current human gate.
argument-hint: '[comment]'
---

Use the story-orchestrator Skill to record approval of the current human gate
(`references/human-gates.md`). Comment: $ARGUMENTS

Refuse if the current stage is not a human gate, or a required artifact is missing or stale, or
the feeding review did not PASS. Invoke no stage Skill. Git only as `references/human-gates.md` says: the story commit at
HUMAN_ACCEPTANCE; the accept commit, merge into dev and push at HUMAN_EPIC_ACCEPTANCE. Finish with the
Orchestration Result.
