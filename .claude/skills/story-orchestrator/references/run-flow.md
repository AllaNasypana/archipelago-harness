# Run Flow — `/so:run`

Drive the workflow stage by stage until a human is needed. Each iteration is exactly one
`continue-flow.md` step; `/so:run` only repeats it. Every automated stage runs in a **fresh
subagent**, so no stage sees another stage's working context, and the orchestrator itself holds
only result envelopes — never artifact bodies.

## Loop

Repeat, at most **12 iterations** per call (a story has 9 automated stages plus a few loop-backs):

1. **Re-read** `workflow-state.yaml` and the last `history.jsonl` event from disk. Never rely on
   what an earlier iteration remembers; the files are the only state.
2. **Stop** (report and end the call) when:
   - there is no active epic, or the epic is `IN_DELIVERY` with no active story (starting a story
     is the human's choice: recommend `/so:start <StoryId>`);
   - `current_stage` is a human gate (enter it first per `human-gates.md`);
   - `status: BLOCKED` and the blocking issues still hold (`continue-flow.md` step 3), including
     an attempt limit;
   - `current_stage` is `CLARIFICATION` in Auto Mode;
   - the iteration cap is reached (say so; `/so:run` again continues).
3. **`CLARIFICATION`** (not Auto Mode): run the interview in this session — it needs the human.
   When `story-clarifier` returns its envelope, record it and continue the loop; do not ask the
   human to run `/so:next`.
4. **Otherwise** perform `continue-flow.md` steps 3–8 for the current stage, invoking the Skill
   through the subagent prompt below, then record the transition. `STALE_INPUT` routing counts as
   an iteration.
5. Print one progress line: `<stage> → <next stage>: <verdict> (<artifact> v<n>)`.

At the end, print the Orchestration Result (`SKILL.md`) for the last iteration and the next
command.

## Subagent prompt

Use the Agent tool (general-purpose). Pass paths, never artifact bodies:

````text
You run one stage of the Archipelago delivery workflow.
Stage: <STAGE>   Skill: <skill>   Epic: <EPIC-nn>   Story: <StoryId|none>
Layer: <api|web>   Risk: <normal|high>
Load .claude/skills/<skill>/SKILL.md and follow it with docs/workflow/stage-contract.md.
Inputs (resolved from docs/workflow/artifact-paths.yaml):
  - <key>: <path>[, <path>...]
Re-entry: none | at <timestamp> from <STAGE>: key <key>, artifacts <path vN>, blocking issues
  <list> | at <timestamp> from <GATE>: comment "<comment>"
Stay in this stage. Never edit docs/workflow/workflow-state.yaml or history.jsonl, never commit,
never start another agent. End your reply with the result envelope
(docs/workflow/artifact-lifecycle.md §2) as one ```yaml block and nothing after it.
````

Run **one subagent at a time**. It may complete in the background: wait for its completion
notification and its final reply; never infer or write an envelope that has not arrived, and
never start the next stage before this one's transition is recorded.

Parse the last `yaml` block as the envelope. No block or an unparseable one → `BLOCKED`
("unparseable envelope from <skill>"), as `SKILL.md` says.

## Context

- Between iterations keep only the progress lines. Do not read artifact bodies to "check" a
  subagent's work: the orchestrator checks existence, front matter and staleness only; quality is
  the review stages' job.
- Everything needed to continue is on disk, so the human may `/clear` at any gate and run
  `/so:run` again in a fresh session.
- The human can interrupt at any time; the last recorded transition is consistent, and the next
  `/so:run` or `/so:next` resumes from it.
