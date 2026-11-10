# Continue Flow — `/so:next`

Advance the active story by **at most one** stage.

1. **Resolve the story.** Read `active-story.yaml` and `workflow-state.yaml`. No active story →
   stop with "run /so:start <StoryId>". Mismatch → `INCONSISTENT`, stop.
2. **Resolve the stage.** `current_stage` must be in `stage_order`, else `INCONSISTENT`.
   `status: NOT_STARTED` becomes `IN_PROGRESS` with this step.
3. **Human gate?** (`type: human_gate`) Invoke nothing. If `pending_human_gate` is empty, build it
   (`human-gates.md`), set `WAITING_FOR_HUMAN`, report, stop. If it is `PENDING`, re-report and stop.
4. **Layer check.** If `applies_to` excludes the story layer, record `NOT_APPLICABLE` (no Skill,
   no artifact), advance, append history, stop.
5. **Invariants.** Check the list in SKILL.md. On failure hold and report.
6. **Reuse.** If the stage already has a current, valid output, reuse its verdict (go to 8).
7. **Invoke one Skill** (`skill`, or `skill_by_layer[layer]`) with story ID, layer, stage and
   resolved input paths. `BACKLOG_SYNC` follows its `run_policy`: never on a routine `continue`.
8. **Apply the envelope** (SKILL.md table). Inspect the produced files at their registry paths.
9. **Record** the transition in `workflow-state.yaml` and append one history event. Stop.

## Result

The Orchestration Result block from SKILL.md. The next command is normally `/so:next`, or
`/so:approve` / `/so:reject <reason>` at a gate.
