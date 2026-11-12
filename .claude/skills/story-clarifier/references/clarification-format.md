# `clarification.md` format

Path: `artifact-paths.yaml` → `clarification`. Keep the section order so diffs stay readable.
Question IDs are stable: never renumber, only append; closed questions stay as the audit trail.

```markdown
---
artifact_type: clarification
story: US-03-02-api
layer: api
version: 1
status: DRAFT # APPROVED after the human's explicit yes
interview: in-progress # in-progress | done
updated_at: <runtime ISO-8601>
produced_by: story-clarifier
inputs:
  - { path: docs/stories/epic-03/US-03-02-api/story.md, version: 1 }
  - { path: docs/stories/epic-03/decisions.md, version: 2 }
  - { path: docs/epics/EPIC-03_Goals_Management.md, commit: <git log -1 --format=%h --abbrev=12> }
---

# US-03-02-api — Clarification

## Hypothesis

One sentence: what the story is really about, as understood before the interview.

## Questions

### Q1 [concurrency] — Duplicate name under concurrent create

- **Status:** open | answered | answered-from-repo | assumed | deferred
- **Question:** As asked.
- **Why it matters:** What changes in the spec, tests or design depending on the answer.
- **Recommended:** Suggested answer and reason.
- **Answer:** The human's words, verbatim. For `answered-from-repo`: the finding and its source.
- **Decision:** One line others can act on.
- **Owner:** Only for `deferred` — who can answer.

## Decisions

- C1 (Q1): … — story-level decisions.
- D-03-04 (Q3): … — recorded in the epic's decisions.md.

## Assumptions

- A1 (Q4): … — taken as true without explicit confirmation; challengeable later.

## Out of scope

- …

## Needs an ADR

- None. / Error response format — blocks this story (AGENTS.md §5).

## Spec checklist

What spec.md must cover, e.g.: endpoint and auth rule; DTO fields with bounds; error responses
for … ; uniqueness under concurrency; migration for … .

## Story changes

Edits to story.md, applied after confirmation:

- AC-3 changed to: Given … when … then … .
- Out of scope added: … .
```

Category tags: `scope`, `acceptance`, `terminology`, `dependencies`; api: `rules`, `authz`,
`validation`, `errors`, `concurrency`, `data`, `response`, `nfr`; web: `states`, `design`, `copy`,
`navigation`, `bff`, `a11y`.
