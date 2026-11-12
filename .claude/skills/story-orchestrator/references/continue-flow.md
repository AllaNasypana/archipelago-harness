# Continue Flow — `/so:next`

Advance by **at most one** stage.

1. **Resolve state.** Read `workflow-state.yaml`.
   - No epic → stop: "run /so:epic <Epic>".
   - Epic `IN_DELIVERY`, no story → stop: list `READY` stories, recommend `/so:start <StoryId>`.
   - Inconsistent state (SKILL.md invariants) → `BLOCKED`, stop.
2. **Human gate?** Invoke nothing. Stale routing (step 4) applies here first. If `pending_human_gate` is empty, enter the gate
   (`human-gates.md`); if `PENDING`, re-report it. Stop.
3. **BLOCKED?** Re-check the reported blocking issues. Still present → re-report and stop. Gone
   (e.g. an ADR was accepted, a decision resolved) → set `IN_PROGRESS` and continue. An attempt
   limit clears only with `/so:next continue` from a human (never Auto Mode): append
   `CONTINUED`, set `attempt: 1`, `IN_PROGRESS`, and continue. A web story blocked by an api
   contract gap: recommend `/so:epic <Epic> <feedback>` (amend, `epic-flow.md`).
4. **Invariants** (SKILL.md). On failure hold and report. A stale artifact → **Stale routing**
   (SKILL.md), record, stop.
5. **Reuse** a current output if one exists (SKILL.md Idempotency), then go to 7 — never after
   a loop-back or rejection into this stage. A finished `CLARIFICATION` is recorded this way.
6. **Invoke** one Skill as SKILL.md "Routing a stage" says:
   - `BACKLOG_SYNC` after a rejection: mode `revise` with the gate's comment as feedback.
   - `CLARIFICATION`: interactive. Refuse in Auto Mode. On a resume, the Skill continues from
     `clarification.md`.
   - Any stage re-entered by a loop-back or rejection: pass the re-entry (`stage-contract.md` →
     Invocation): the event's `timestamp` as `at`, its `from_stage`, and `last_result`'s key,
     artifacts and `blocking_issues`, or its `comment`.
7. **Apply the envelope** (SKILL.md). Inspect the produced files at their registry paths.
8. **Record** the transition and append history. If the next stage is a gate, enter it
   (`human-gates.md`). Stop.

## Result

The Orchestration Result. The next command is `/so:next`, or `/so:approve` / `/so:reject` at a
gate.
