# Workflow Stages (Explanatory) — DRAFT

> **Status:** v0.5 (2026-11-09), adapted from `ai/customer-portal/docs/workflow/stages.md`.
> **Normative definition:** [`stage-map.yaml`](stage-map.yaml) (status `draft` until the stage Skills
> and `artifact-paths.yaml` exist). This file is explanatory; if it disagrees with `stage-map.yaml`,
> `stage-map.yaml` wins. Do not define stage identifiers anywhere else.

The story-delivery workflow moves **one active User Story** from the backlog to an archived,
merged delivery for the Archipelago monorepo (`apps/web` Next.js + thin BFF, `apps/api` NestJS
modular monolith, Prisma, PostgreSQL). Each automated stage is executed by exactly one Skill and
produces artifacts addressed by registry keys in [`artifact-paths.yaml`](artifact-paths.yaml). All
artifacts of one story live in one folder, `docs/stories/{story_id}/` (e.g. `docs/stories/US-03-02-api/spec.md`).
Human gates stop the workflow until a person records a decision with `/so:approve` or
`/so:reject`. Only `story-orchestrator` records transitions; stage Skills never edit workflow
state.

## Sources every stage reads

| Source                                                    | Role                                                               |
| --------------------------------------------------------- | ------------------------------------------------------------------ |
| `AGENTS.md`                                               | Architecture boundaries, coding, testing and security rules        |
| `docs/product/archipelago-business-requirements.md` (BRD) | Resolves conflicts between sources; FR/BR/NFR IDs for traceability |
| `docs/product/Archipelago_PRD_v1.2.md`                    | Product scope                                                      |
| `docs/epics/EPIC-0X_*.md`                                 | Approved epic specifications; win over mockups                     |
| `docs/design/README.md` + mockups                         | Visual references, app-shell rule, per-set corrections             |
| `docs/adr/`                                               | Accepted architecture decisions (none yet)                         |

## Before the workflow: slicing an epic into stories

Stories do not exist yet; they are cut from approved epics by the epic-level Skill
**`story-slicer`**. It runs once per epic (or when an epic changes), **outside** the per-story
loop, and writes the proposed story list to `docs/stories/slices/EPIC-<nn>-slice.md`. A human
approves the slice before any story is activated. `BACKLOG_SYNC` then creates
`docs/stories/{story_id}/story.md` and the catalog from the slice, or imports the story from
GitHub Issues when that source is configured.

### Small stories

A story is small when **all** of these hold:

- one user-visible behavior, or one cohesive API capability;
- at most ~5 acceptance criteria, each testable on its own;
- one backend module **or** one web feature folder;
- reviewable in one sitting: aim for a diff of a few hundred lines, excluding generated code;
- traced to concrete BRD FR/BR IDs and epic AC IDs.

If a candidate breaks a rule, split it: by state (happy path / validation / error), by
operation (create / edit / archive), or by role of the data (write / read).

### Backend and frontend stories

Every story has exactly one **`layer`**:

| `layer` | Scope                                                                                                                    | Never contains                    |
| ------- | ------------------------------------------------------------------------------------------------------------------------ | --------------------------------- |
| `api`   | `apps/api`: domain, use cases, Prisma (`app` schema), REST endpoint, OpenAPI contract, regenerated `packages/api-client` | Pages, components, BFF handlers   |
| `web`   | `apps/web`: pages, components, forms, BFF route handlers, `bff` schema (sessions), i18n strings                          | NestJS code, `app` schema changes |

Rules:

- A user-facing capability is usually a pair, e.g. `US-03-02-api` then `US-03-02-web` (OQ-6).
- A `web` story **depends on** its `api` story: it may start only when that story's `openapi`
  artifact is `APPROVED`; it may merge only after the `api` story is `COMPLETED`.
- The contract between them is the OpenAPI document and the generated client — nothing else.
- Pure backend work (outbox, email adapter) and pure UI work (app shell, design tokens) are single
  stories without a pair.

## Stage sequence

| #   | Stage                         | Type             | Owner Skill                              | Applies to | Produces (registry keys)                                    |
| --- | ----------------------------- | ---------------- | ---------------------------------------- | ---------- | ----------------------------------------------------------- |
| 1   | `BACKLOG_SYNC`                | skill            | `backlog-sync`                           | both       | `story`, `story_catalog`                                    |
| 2   | `CLARIFICATION`               | skill            | `us-clarifier`                           | both       | `clarification_report`, `open_decisions`                    |
| 3   | `SPECIFICATION`               | skill            | `spec-writer`                            | both       | `specification`                                             |
| 4   | `SPEC_REVIEW`                 | skill            | `spec-verifier`                          | both       | `specification_review`                                      |
| 5   | `HUMAN_SPEC_APPROVAL`         | human gate       | human                                    | both       | —                                                           |
| 6   | `API_DESIGN`                  | skill (optional) | `openapi-designer`                       | `api`      | `api_design`, `openapi`                                     |
| 7   | `DB_DESIGN`                   | skill (optional) | `db-designer`                            | `api`¹     | `database_design`, `entity_model`                           |
| 8   | `UI_DESIGN`                   | skill (optional) | `ui-designer`                            | `web`      | `ui_design`                                                 |
| 9   | `DESIGN_REVIEW`               | skill (optional) | `design-reviewer`                        | both       | `design_review`                                             |
| 10  | `IMPACT_ANALYSIS`             | skill            | `impact-analyzer`                        | both       | `impact_analysis`                                           |
| 11  | `IMPLEMENTATION_PLANNING`     | skill            | `implementation-planner`                 | both       | `implementation_plan`                                       |
| 12  | `PLAN_REVIEW`                 | skill            | `plan-reviewer`                          | both       | `plan_review`                                               |
| 13  | `HUMAN_PLAN_APPROVAL`         | human gate       | human                                    | both       | —                                                           |
| 14  | `TEST_WRITING`                | skill            | `test-writer`                            | both       | `test_strategy`, `ac_test_matrix`, `test_generation_report` |
| 15  | `IMPLEMENTATION`              | skill            | `nest-implementor` / `next-implementor`² | both       | `implementation_report`                                     |
| 16  | `IMPLEMENTATION_VERIFICATION` | skill            | `implementation-verifier`                | both       | `implementation_verification`                               |
| 17  | `SECURITY_REVIEW`             | skill            | `security-reviewer`                      | both       | `security_review`                                           |
| 18  | `RECONCILIATION`              | skill            | `reconciliation-reviewer`                | both       | `reconciliation`, `traceability`                            |
| 19  | `HUMAN_PR_APPROVAL`           | human gate       | human                                    | both       | —                                                           |
| 20  | `PR_PREPARATION`              | skill            | `pr-preparer`                            | both       | `pr_summary`                                                |
| 21  | `READY_FOR_PR`                | human gate       | human                                    | both       | —                                                           |
| 22  | `COMPLETED`                   | human gate       | human                                    | both       | —                                                           |
| 23  | `ARCHIVED`                    | terminal         | `story-orchestrator`                     | both       | `delivery_summary`                                          |

¹ A `web` story runs `DB_DESIGN` only when it changes the `bff` session schema.
² The orchestrator picks the Skill by `story.layer`; the stage itself is one. This replaces
customer-portal's `springboot-implementor`.

What changed against customer-portal: the `layer` field and its routing, the new `UI_DESIGN`
stage, Next.js/NestJS implementors, Prisma schema ownership in `DB_DESIGN`, real repo commands in
verification, and traceability to BRD/epic IDs in `RECONCILIATION`.

## Optional design stages

A design stage emits `NOT_APPLICABLE` when it does not apply to the story's `layer`, or when the
approved Specification explicitly says the area does not change. The reason is recorded.

| Stage           | Not applicable when the Story…                                                |
| --------------- | ----------------------------------------------------------------------------- |
| `API_DESIGN`    | is `web`, or does not change NestJS endpoints, DTOs or error responses        |
| `DB_DESIGN`     | does not change the `app` or `bff` schema                                     |
| `UI_DESIGN`     | is `api`, or has no user-visible change                                       |
| `DESIGN_REVIEW` | all three design stages were `NOT_APPLICABLE`; still writes a one-line review |

`API_DESIGN` is contract-first (AGENTS.md §3.11): OpenAPI and DTOs are agreed before code.

`UI_DESIGN` must:

- take the header, sidebar and profile menu only from `docs/design/mockups/general/` (BRD D17);
- list the mockup panels used and apply the corrections recorded in the epic and `docs/design/README.md`;
- use the epic text alone where the index says so (EPIC-06 10–12, EPIC-07 05–12);
- reuse tokens from `apps/web/src/styles/theme.css` and classes from `components.css`; new tokens or
  classes are listed explicitly;
- list every new UI string key for both `en` and `uk`;
- cover loading, empty, error and success states, and the 360 px rule where BRD D9 requires it.

## Code quality bar

The harness exists to produce code a person reads easily. Planning, implementation and review
stages apply the same bar (AGENTS.md §5):

- concise and idiomatic for the framework: Next.js App Router, NestJS, Prisma, React Hook Form + Zod;
- clear names over comments; comments explain _why_, never restate the code;
- small functions and components with one job; no speculative abstractions or unused options;
- no duplication of styles, types or validation that already has a home;
- `PLAN_REVIEW` rejects plans that add layers or abstractions the story does not need;
  `IMPLEMENTATION_VERIFICATION` reports readability problems as findings, not just test results.

## Verification commands

`IMPLEMENTATION_VERIFICATION` records the exact commands and their results. Baseline, from the
repo root:

```bash
pnpm db:up
pnpm --filter @archipelago/api prisma:generate
pnpm turbo run lint typecheck test build
pnpm --filter @archipelago/api test:e2e   # api stories that touch HTTP flows
# web stories: unit, hook and component tests run inside `turbo run test` (ADR-001)
```

Not available yet (add when first needed): module-boundary check (AGENTS.md §6), OpenAPI ↔
generated client drift check, i18n key completeness check (`en`/`uk`), Playwright e2e (ADR-001).

## Loop-backs

Every review stage can send the story back with `verdict: CHANGES_REQUIRED` and a loop-back key
defined for that stage in `stage-map.yaml`. Additions to the customer-portal map (all present in `stage-map.yaml`):

| Stage             | New key               | Target      |
| ----------------- | --------------------- | ----------- |
| `DESIGN_REVIEW`   | `changes_required_ui` | `UI_DESIGN` |
| `IMPACT_ANALYSIS` | `changes_required_ui` | `UI_DESIGN` |
| `TEST_WRITING`    | `invalid_ui_design`   | `UI_DESIGN` |
| `RECONCILIATION`  | `ui_gap`              | `UI_DESIGN` |

A `web` story that finds a gap in its `api` contract does **not** loop into the `api` story; it
goes `BLOCKED` with an open decision, and a new or reopened `api` story fixes the contract.

All other loop-backs stay as in customer-portal (e.g. `SPEC_REVIEW → SPECIFICATION`,
`IMPLEMENTATION_VERIFICATION → IMPLEMENTATION`, `RECONCILIATION story_source_conflict → BACKLOG_SYNC`).

## Verdicts and statuses

Same as customer-portal: verdicts `PASS`, `CHANGES_REQUIRED`, `BLOCKED`, `NOT_APPLICABLE`
(optional stages only); artifact lifecycle `DRAFT → IN_REVIEW → APPROVED → SUPERSEDED / ARCHIVED`.

## Terminal-stage meanings

- **`READY_FOR_PR`** — all automated checks passed; a human opens or finalizes the Pull Request.
- **`COMPLETED`** — a human confirms the PR was merged (or the delivery was explicitly closed).
  Archive mode runs only from here.
- **`ARCHIVED`** — knowledge consolidated, workflow state cleaned; artifacts are not moved.

## Decisions and open questions

| ID   | Topic                        | Status      | Decision / proposal                                                                                                                    |
| ---- | ---------------------------- | ----------- | -------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Story source                 | **decided** | `story-slicer` cuts small stories from epics outside the per-story loop (user, 2026-11-09)                                             |
| OQ-2 | `UI_DESIGN` as its own stage | **decided** | Separate optional stage, applies to `web` stories (user, 2026-11-09)                                                                   |
| OQ-3 | Implementor                  | **decided** | Stories split by `layer`; one `IMPLEMENTATION` stage, Skill chosen by layer (user, 2026-11-09)                                         |
| OQ-4 | Web test runner / e2e        | **decided** | Vitest + Testing Library for logic, hooks and components; Playwright for key journeys later — [ADR-001](../adr/ADR-001-web-testing.md) |
| OQ-5 | Command prefix `/so:`        | **decided** | Keep `/so:approve` / `/so:reject` (user, 2026-11-09)                                                                                   |
| OQ-6 | Story ID format              | **decided** | `US-<epic>-<nn>-<layer>`, e.g. `US-03-02-api`, `US-03-02-web` (user, 2026-11-09)                                                       |
