---
description: Run the workflow stage by stage until a human gate, CLARIFICATION or a block.
---

Use the story-orchestrator Skill in `run` mode (`references/run-flow.md`).

Each automated stage runs in a fresh subagent; record every transition in
`docs/workflow/workflow-state.yaml` and `docs/workflow/history.jsonl` before the next one. Stop
at every human gate, at a block or attempt limit, at the iteration cap, and when no story is
active. Run CLARIFICATION as an interview with the human in this session (never in Auto Mode),
then continue. Finish with the Orchestration Result and the next command.
