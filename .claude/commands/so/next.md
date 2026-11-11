---
description: Advance the workflow by one stage.
argument-hint: '[continue]'
---

Use the story-orchestrator Skill in `continue` mode (`references/continue-flow.md`). Arguments:
$ARGUMENTS (`continue` clears an attempt-limit block).

At most one stage and one stage Skill. CLARIFICATION is an interview with the human and never
runs in Auto Mode. Stop at human gates. Record the transition in `docs/workflow/workflow-state.yaml`
and `docs/workflow/history.jsonl`. Finish with the Orchestration Result.
