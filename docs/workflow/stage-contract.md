# Stage Skill Contract

What every story-stage Skill does the same way. A Skill's own `SKILL.md` adds only what is
specific to its stage. Normative routing stays in `stage-map.yaml`.

## Invocation

`story-orchestrator` passes: epic, story ID, layer, risk, stage, the resolved input paths, and —
when the stage was re-entered — the **re-entry**: `at` (the re-entry event's timestamp), `from`
(the sending stage), and either the loop-back `key` with the sending artifacts (path, version) and
`blocking_issues`, or the human's `comment`. Paths come from `artifact-paths.yaml`; never
hard-code them.

## Before working

1. Read every input. Check the front matter of each workflow artifact you read. Return `BLOCKED`
   naming it if an input is missing, or an **input** is itself stale (a higher `version` or a
   changed `commit`, `artifact-lifecycle.md` §1). Your **own** artifact being stale is not a
   block: it is the reason you run — revise it, or only refresh `inputs` if the change does not
   affect it, and record the current versions and commits.
2. Read the rules: `agents_rules` (`AGENTS.md`) and every file of `layer_rules` for the story's
   layer (`artifact-paths.yaml`: api → `apps/api/AGENTS.md`; web → `apps/web/AGENTS.md`,
   `apps/web/docs/web-patterns.md`). They bind your artifact; list each in `inputs`. Only
   `Accepted` ADRs bind.
3. Re-entered? Read the sending artifact and fix exactly what its blocking findings (or the
   comment) name; keep the rest unchanged. Revise in place (`version + 1`, `status: DRAFT`),
   append the re-entry to `feedback` (never to `inputs`), and add a **Feedback addressed**
   section: each blocking finding or comment → what changed, or why not.
4. Web: this Next.js version differs from older ones. Before you name or use a Next.js API, file
   convention or config flag (route segment files, `proxy.ts`, caching, `next.config.ts`), read its
   guide in `apps/web/node_modules/next/dist/docs/` (not visible from the repo root) and cite the
   doc path next to the choice in your artifact. Heed deprecation notices; memory of older
   versions is not a source.
5. Reviewing again (your own artifact exists from an earlier run)? First check every blocking
   finding of its previous version and mark each `resolved` or `still open` in Findings.

## While working

- Stay in your stage: no work that belongs to another stage, no edits to artifacts you do not own.
- Never invent requirements, limits, fields or conventions. A missing product decision, or a
  project-wide convention without an ADR (AGENTS.md §5), is `BLOCKED` with the question named.
- Quote rule IDs (BR-, FR-, NFR-, epic AC IDs, `D-<epic>-<nn>`) so every claim is traceable.
- Write artifacts in English, short and scannable: tables and lists before prose.
- Never commit, push or branch; never run destructive database commands.

## Output

Write your artifact at its registry path with the front matter from `artifact-schema.md`
(`inputs` = every document passed to you, each with its `version` or `commit`). Read no other
workflow artifact or project document (code, tests and installed library docs are free; the mockups `design_index` lists count as part of it): if
you need one, it is missing from the stage's `inputs`
in `stage-map.yaml` — return `BLOCKED` naming it rather than reading it silently. Review Skills also write `verdict`.

## Result envelope

Return the envelope from `artifact-lifecycle.md` §2. `CHANGES_REQUIRED` only with a
`loop_back_key` that exists under your stage in `stage-map.yaml`. Then give the human one or two
sentences: what was produced, what needs their attention.
