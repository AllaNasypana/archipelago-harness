# Workflow Stages (Explanatory)

> **Status:** v2 draft (2026-11-11), adapted from `ai/customer-portal`.
> **Normative definition:** [`stage-map.yaml`](stage-map.yaml). This file explains it; if they
> disagree, `stage-map.yaml` wins. Do not define stages or routing anywhere else.

The workflow delivers **one epic at a time**, as small stories, **one story at a time**. An epic
is cut into stories once; each story then goes from clarification to human acceptance. Each
automated stage is run by exactly one Skill and writes artifacts addressed by registry keys in
[`artifact-paths.yaml`](artifact-paths.yaml). Only `story-orchestrator` records transitions;
stage Skills never edit workflow state. A review `PASS` is never human approval. What every stage Skill
does the same way (inputs, re-entry, output, result) is in [`stage-contract.md`](stage-contract.md).

## Sources every stage reads

| Source                                                    | Role                                                   |
| --------------------------------------------------------- | ------------------------------------------------------ |
| `AGENTS.md`, `apps/{api,web}/AGENTS.md`                   | Architecture boundaries, coding, testing, security     |
| `docs/product/archipelago-business-requirements.md` (BRD) | Wins on conflict; FR/BR/NFR IDs for traceability       |
| `docs/epics/EPIC-<nn>_*.md`                               | Approved epic: flows, rules, AC IDs; wins over mockups |
| `docs/product/Archipelago_PRD_v1.2.md`                    | Product scope                                          |
| `docs/design/README.md` + mockups                         | Visual references, app-shell rule, per-set corrections |
| `docs/adr/`                                               | Only `Accepted` ADRs bind                              |

## At a glance

```text
/so:epic EPIC-03
  BACKLOG_SYNC ─▶ HUMAN_BACKLOG_APPROVAL                      once per epic
/so:start US-03-02-api   (then /so:next … /so:approve)
  CLARIFICATION ─▶ SPECIFICATION ─▶ SPEC_REVIEW ─▶ HUMAN_SPEC_APPROVAL
  ─▶ PLANNING ─▶ HUMAN_PLAN_APPROVAL (risk: high only)
  ─▶ TEST_FIRST ─▶ IMPLEMENTATION ─▶ REVIEW ─▶ HUMAN_ACCEPTANCE ─▶ DONE
```

Everything lives under `docs/stories/epic-<nn>/`:

```text
docs/stories/epic-03/
  backlog.md        story table (the catalog), epic AC coverage, open questions
  decisions.md      product decisions shared by the epic's stories
  US-03-02-api/     story.md  clarification.md  spec.md  spec-review.md
                    plan.md  tests.md  implementation.md  review.md
```

## Epic level

### `BACKLOG_SYNC` — `backlog-sync`

Cuts the epic into stories and writes `backlog.md` (every story `PROPOSED`), every `story.md` and the
first `decisions.md` with product questions the epic leaves open. Questions about project-wide
conventions (error format, pagination, IDs, dates, logging — AGENTS.md §5) are proposed as ADRs,
not decided per epic.

**Small story** — all of these hold:

- one user-visible behavior or one cohesive API capability;
- 2–5 acceptance criteria, each testable on its own;
- one backend module **or** one web feature folder;
- reviewable in one sitting: a few hundred changed lines, excluding generated code;
- traced to BRD FR/BR IDs and epic AC IDs.

Too big → split by state (happy path / validation / errors), by operation (create / edit /
archive) or by data role (write / read).

**One layer per story:**

| `layer` | Scope                                                                                                                                        | Never contains                    |
| ------- | -------------------------------------------------------------------------------------------------------------------------------------------- | --------------------------------- |
| `api`   | `apps/api`: domain, use cases, Prisma `app`, REST endpoints with Swagger decorators, regenerated client, shared validation vectors (ADR-004) | Pages, components, BFF handlers   |
| `web`   | `apps/web`: pages, components, forms, hooks, BFF route handlers, `bff` schema, `en`/`uk` strings                                             | NestJS code, `app` schema changes |

- A user-facing capability is usually a pair, `US-03-02-api` then `US-03-02-web`.
- The web story names the api story in `depends_on` and starts only when it is `DONE`. OpenAPI is
  generated from NestJS code, so the contract is the merged endpoint plus the regenerated
  `packages/api-client` and the shared validation vectors the web form imports (ADR-004).
- Every web stage from `CLARIFICATION` to `REVIEW` reads the api story's `spec.md`
  (`dependency_spec`).
- Pure backend work (outbox) and pure UI work (app shell) are single stories.
- Foundation work no epic owns gets a `US-00` ID, lives in `epic-00/` and is delivered inside
  the epic that first needs it.

**Risk.** A story is `risk: high` when it touches authentication, sessions, cookies or the BFF
token boundary; adds or changes a migration; spans more than one module or runs a cross-module
transaction; or changes authorization or the outbox. High risk makes `HUMAN_PLAN_APPROVAL`
mandatory.

### `HUMAN_BACKLOG_APPROVAL`

You review the split, order, dependencies and risk once per epic. Approve → stories become
`READY`. Reject with a comment → `BACKLOG_SYNC` writes a new version.

**Amend.** During delivery, `/so:epic <Epic> <feedback>` changes an approved backlog: a split
proposed at `CLARIFICATION`, a new api story for a contract gap, deferred stories that are now
unblocked. A `BLOCKED` active story is parked (back to `READY`). Started stories never change;
a replaced `READY` story becomes `DROPPED`. The backlog passes this gate again.

## Story level

| #   | Stage                 | Skill                                    | Writes                     |
| --- | --------------------- | ---------------------------------------- | -------------------------- |
| 1   | `CLARIFICATION`       | `story-clarifier` (interactive)          | `clarification.md`¹        |
| 2   | `SPECIFICATION`       | `spec-writer`                            | `spec.md`                  |
| 3   | `SPEC_REVIEW`         | `spec-reviewer` (fresh context)          | `spec-review.md`           |
| 4   | `HUMAN_SPEC_APPROVAL` | human                                    | —                          |
| 5   | `PLANNING`            | `implementation-planner`                 | `plan.md`                  |
| 6   | `HUMAN_PLAN_APPROVAL` | human, only for `risk: high`             | —                          |
| 7   | `TEST_FIRST`          | `test-writer`                            | tests + `tests.md`         |
| 8   | `IMPLEMENTATION`      | `nest-implementor` / `next-implementor`² | code + `implementation.md` |
| 9   | `REVIEW`              | `story-reviewer` (fresh context)         | `review.md`                |
| 10  | `HUMAN_ACCEPTANCE`    | human                                    | —                          |
| 11  | `DONE`                | `story-orchestrator`                     | backlog status             |

¹ Also applies the confirmed changes to `story.md` and records epic-wide answers in `decisions.md`.
² Chosen by `story.layer`.

### `CLARIFICATION`

Based on customer-portal's `story-clarifier`: an interview, not a report. It needs you live;
Auto Mode stops here.

1. Reads the story, epic, BRD, design index, ADRs, `decisions.md` and — for a web story — the api
   dependency's `spec.md`. Whatever these answer is recorded as `answered-from-repo` with its
   source; you can veto it.
2. Writes `clarification.md` before the first question: hypothesis and candidate questions,
   blocking ones first.
3. Asks **one question at a time**, each with a recommended answer and why it matters, and
   updates the file after every answer. An interrupted interview resumes from the file.
4. Question categories follow the layer:
   - **api** — business rules and invariants, authorization, validation limits, error responses,
     uniqueness and concurrency, persistence changes, what the endpoint returns.
   - **web** — UI states (loading, empty, error, success), mockup panels and corrections, `en`/`uk`
     wording, 360 px, navigation, how the BFF surfaces api errors.
   - **both** — scope and out of scope, terminology, dependencies.
5. A web story **inherits** its api story's decisions; it does not ask them again.
6. Ends with a short restatement and your explicit "yes". Then it applies the agreed changes to
   `story.md`, marks `clarification.md` `APPROVED` and returns `PASS`. No clear yes → `BLOCKED`.

### `SPECIFICATION` — the design lives here

`spec.md` has testable ACs (Given/When/Then, with rule IDs), out of scope, and one **design
section for the story's layer**:

- **api** — endpoints (method, path, auth), request/response DTOs with validation, error
  responses, authorization rule, domain rules, Prisma changes and migration. Contract first
  (AGENTS.md §3.11): the DTOs and decorators are designed here, the OpenAPI document is
  generated from them.
- **web** — route, components, form fields and the Zod mirror of server validation, UI states,
  mockup panels used with corrections applied, `en`/`uk` keys, BFF route handlers and api client
  calls. Header, sidebar and profile menu come only from `docs/design/mockups/general/` (BRD
  D17); use epic text alone where the design index says so; reuse `theme.css` tokens and
  `components.css` classes and list any new one.

It restates `risk` and raises it when a risk rule applies.

### `SPEC_REVIEW` → `HUMAN_SPEC_APPROVAL`

A fresh-context reviewer checks that every story AC is covered and testable, the design obeys
AGENTS.md boundaries, and nothing is invented beyond the clarification. Then you approve the spec.

### `PLANNING` → `HUMAN_PLAN_APPROVAL`

`plan.md`: files to add or change, impact on existing code, migration steps, and the **AC → test
matrix** (test level and file per AC). The gate is skipped for `risk: normal`; the plan is still
checked by `REVIEW` against the diff.

### `TEST_FIRST` → `IMPLEMENTATION`

Tests are written from the matrix and must fail for the right reason (red). The implementor makes
them pass (green), never edits a test to hide a defect, and regenerates `packages/api-client`
when an api story changes an endpoint.

### `REVIEW` → `HUMAN_ACCEPTANCE` → `DONE`

`story-reviewer` runs in a fresh context. It first runs the checks below and records the output
verbatim, then reviews in three parts:

- **correctness** — every AC has a passing test, and the diff matches the spec and the plan;
- **security** — BFF boundary and token isolation, cookies (CSRF, fixation, revocation), NestJS
  authorization on every resource, `app`/`bff` isolation, secrets and logging (AGENTS.md §3, §7);
- **readability** — the code quality bar below.

You then read the diff and `review.md` and accept the story. `DONE` marks it in `backlog.md` and
frees the workflow for the next `/so:start`.

## Loop-backs and rejections

| From             | Key / reject target                                                     | To                                                             |
| ---------------- | ----------------------------------------------------------------------- | -------------------------------------------------------------- |
| `SPEC_REVIEW`    | `changes_required` / `clarification_gap`                                | `SPECIFICATION` / `CLARIFICATION`                              |
| `PLANNING`       | `specification_gap`                                                     | `SPECIFICATION`                                                |
| `TEST_FIRST`     | `plan_gap` / `specification_gap`                                        | `PLANNING` / `SPECIFICATION`                                   |
| `IMPLEMENTATION` | `partial` / `plan_gap`                                                  | `IMPLEMENTATION` / `PLANNING`                                  |
| `REVIEW`         | `implementation_issues` / `test_gap` / `plan_gap` / `specification_gap` | `IMPLEMENTATION` / `TEST_FIRST` / `PLANNING` / `SPECIFICATION` |
| Any human gate   | `/so:reject [stage] <comment>`                                          | `on_reject` or a listed `reject_targets` stage                 |

A revised artifact is `DRAFT` again, so the story passes its gate again. A web story that finds a
gap in its api contract does not loop into the api story: it goes `BLOCKED`, and a backlog amend (`/so:epic <Epic> <feedback>`) adds a new api story and a replacement web story that depends on it; the blocked story is parked, then dropped.

A stage that runs more than `max_attempts` (3) times in a row is `BLOCKED` until you run
`/so:next continue`.

## Code quality bar

The harness exists to produce code a person reads easily (AGENTS.md §5):

- concise and idiomatic for Next.js App Router, NestJS, Prisma, React Hook Form + Zod;
- clear names over comments; comments explain _why_;
- small functions and components with one job; no speculative abstractions or unused options;
- no duplicated styles, types or validation that already have a home.

`PLANNING` must not add layers the story does not need; `REVIEW` reports readability problems as
findings.

## Checks

`REVIEW` runs, from the repo root:

```bash
pnpm db:up
pnpm --filter @archipelago/api prisma:generate
pnpm turbo run lint typecheck test build
pnpm --filter @archipelago/api test:e2e   # api stories that touch HTTP flows
```

To add when first needed, as scripts rather than LLM judgement: module-boundary check, OpenAPI ↔
generated client drift, `en`/`uk` key completeness, Playwright e2e (ADR-001).

## Compared with customer-portal

| customer-portal (per story)                                   | Archipelago                                                 |
| ------------------------------------------------------------- | ----------------------------------------------------------- |
| `BACKLOG_SYNC` per story from GitHub                          | `BACKLOG_SYNC` once per epic, with a human gate             |
| `us-clarifier` writes Open Decisions alone                    | `story-clarifier` interviews you; epic decisions are shared |
| `API_DESIGN`, `DB_DESIGN`, `DESIGN_REVIEW`, `IMPACT_ANALYSIS` | design sections in `spec.md`, impact in `plan.md`           |
| `PLAN_REVIEW` + `HUMAN_PLAN_APPROVAL` always                  | plan gate only for `risk: high`                             |
| `TEST_WRITING` / `springboot-implementor`                     | `TEST_FIRST` (red) / implementor by layer (green)           |
| verification, security, reconciliation: three stages          | one fresh-context `REVIEW`                                  |
| PR preparation, `READY_FOR_PR`, `COMPLETED`, `ARCHIVED`       | `HUMAN_ACCEPTANCE` → `DONE`                                 |
| 22 stages, 5 human gates, ~20 artifacts                       | 11 stages, 2–3 human gates, 8 artifacts                     |

## Decisions and open questions

| ID   | Topic                 | Status      | Decision                                                                                                                                                                                          |
| ---- | --------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| OQ-1 | Story source          | **decided** | `BACKLOG_SYNC` cuts the active epic into stories under `docs/stories/epic-<nn>/` (user, 2026-11-11)                                                                                               |
| OQ-2 | Design stages         | **decided** | Design is a section of `spec.md` per layer; replaces the separate `UI_DESIGN` stage (user, 2026-11-11)                                                                                            |
| OQ-3 | Implementor           | **decided** | One `IMPLEMENTATION` stage, Skill chosen by `layer` (user, 2026-11-09)                                                                                                                            |
| OQ-4 | Web test runner / e2e | **decided** | Vitest + Testing Library; Playwright for key journeys later — [ADR-001](../adr/ADR-001-web-testing.md)                                                                                            |
| OQ-5 | Command prefix        | **decided** | `/so:` (user, 2026-11-09)                                                                                                                                                                         |
| OQ-6 | Story ID format       | **decided** | `US-<epic>-<nn>-<layer>` (user, 2026-11-09)                                                                                                                                                       |
| OQ-7 | Workflow size         | **decided** | Compact flow, plan gate for `risk: high` only (user, 2026-11-11)                                                                                                                                  |
| OQ-8 | Git after acceptance  | open        | What happens in Git when a story is accepted; to decide later (user, 2026-11-11). Until then `/so:start` needs a clean `apps/` + `packages/` tree, so the human commits or stashes accepted work. |
