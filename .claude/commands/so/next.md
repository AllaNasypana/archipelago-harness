---
description: Advance the active story by one workflow stage.
---

Use the story-orchestrator Skill in `continue` mode (`references/continue-flow.md`).

At most one transition and at most one stage Skill. Stop at human gates. Record the transition in
`docs/workflow/workflow-state.yaml` and `docs/workflow/history.jsonl`. Finish with the
Orchestration Result. Do not continue to another stage.
