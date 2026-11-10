# Archive Flow — `/so:archive`

Explicit human request only. Consolidates a finished story and returns the workflow to `IDLE`.

## Preconditions

- `current_stage: COMPLETED` (a human confirmed the merge with `/so:approve`).
- `reconciliation` and `pr_summary` are current and `APPROVED`; no blocking Open Decisions.
- Every mandatory output from `stage-map.yaml` exists or was recorded `NOT_APPLICABLE`.

## Steps

1. Write the `delivery_summary` (registry path; you own it): story, layer, dependency, PR
   reference, activation/completion/archive timestamps, artifact inventory (type, path, version),
   final AC result, final verification/security/reconciliation verdicts, known limitations,
   deferred work. No secrets.
2. Set the story to `ARCHIVED` in the catalog and its artifacts' status to `ARCHIVED`. Move or
   delete nothing.
3. Update `project_state` (`docs/knowledge/project-state.md`) with the capability delivered.
4. **Propose** — do not apply — changes to `AGENTS.md`, `docs/architecture/` or epics that the
   delivery implies. Apply only after explicit approval in this session.
5. Reset state: `active-story.yaml` fields to `null`; `workflow-state.yaml` `story: null`,
   `current_stage: null`, `status: IDLE`, `archived_at` (runtime).
6. Append `{"verdict":"ARCHIVED","to_stage":"ARCHIVED","skill":"story-orchestrator",...}`.

## Result

Archived story, delivery summary path, proposed vs applied knowledge updates, and the next
`READY` stories — especially a `web` story unblocked by this `api` story.
