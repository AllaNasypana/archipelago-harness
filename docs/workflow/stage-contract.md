# Stage Skill Contract

What every story-stage Skill does the same way. A Skill's own `SKILL.md` adds only what is
specific to its stage. Normative routing stays in `stage-map.yaml`.

## Invocation

`story-orchestrator` passes: epic, story ID, layer, risk, stage, the resolved input paths, and —
when the stage was re-entered — the loop-back key or the human's rejection comment. Paths come
from `artifact-paths.yaml`; never hard-code them.

## Before working

1. Read every input. Check the front matter of each workflow artifact you read. Return `BLOCKED`
   naming it if an input is missing, or an **input** is itself stale (it lists an input now at a
   higher version, `artifact-lifecycle.md` §1). Your **own** artifact being stale is not a block:
   it is the reason you run — revise it and record the current input versions.
2. Read the rules for the layer: `AGENTS.md`, `apps/api/AGENTS.md` or `apps/web/AGENTS.md`, and
   for web `apps/web/docs/web-patterns.md`. Only `Accepted` ADRs bind.
3. Re-entered? Fix exactly what the key or comment names, revise in place (`version + 1`,
   `status: DRAFT`), and keep the rest unchanged.

## While working

- Stay in your stage: no work that belongs to another stage, no edits to artifacts you do not own.
- Never invent requirements, limits, fields or conventions. A missing product decision, or a
  project-wide convention without an ADR (AGENTS.md §5), is `BLOCKED` with the question named.
- Quote rule IDs (BR-, FR-, NFR-, epic AC IDs, `D-<epic>-<nn>`) so every claim is traceable.
- Write artifacts in English, short and scannable: tables and lists before prose.
- Never commit, push or branch; never run destructive database commands.

## Output

Write your artifact at its registry path with the front matter from `artifact-schema.md`
(`inputs` = every workflow artifact read, with its version). Review Skills also write `verdict`.

## Result envelope

Return the envelope from `artifact-lifecycle.md` §2. `CHANGES_REQUIRED` only with a
`loop_back_key` that exists under your stage in `stage-map.yaml`. Then give the human one or two
sentences: what was produced, what needs their attention.
