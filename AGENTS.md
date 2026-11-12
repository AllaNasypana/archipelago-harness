# AGENTS.md — Archipelago

> Project-wide rules for every task in this repository. App-specific rules: [`apps/web/AGENTS.md`](apps/web/AGENTS.md), [`apps/api/AGENTS.md`](apps/api/AGENTS.md). Product rules: §5.1. Architectural implementation choices still require ADR approval.

## 1. Product Context

Archipelago is a personal-first application for aligning invested time with strategic priorities through the loop **Choose Focus → Invest Time → Reflect → Adjust**. MVP users have a personal Workspace containing Projects, Goals, manual Contributions, independent Progress Events, versioned Weekly Focus plans, Alignment views, and Weekly Reflections. It is not a task manager or productivity-scoring system. Shared workspace collaboration, role-management UI and any admin role/UI are post-MVP; the internal OWNER Membership created during registration remains required. The initial release targets approximately 20–100 users. **English (en) is the default UI language; Ukrainian (uk) is mandatory by the first MVP release.** Every UI string is externalized with `en` and `uk` keys from the start; user-authored content is never auto-translated.

## 2. Technology Stack

- Monorepo: pnpm workspaces, Turborepo, TypeScript.
- Web: Next.js App Router, React, Tailwind CSS, shadcn/ui, TanStack Query, Zustand only where appropriate for UI/client state, React Hook Form + Zod.
- API: NestJS modular monolith, REST `/api/v1`, OpenAPI, Prisma, PostgreSQL; `class-validator` for request DTO validation.
- Planned real-time communication: Socket.IO with NestJS WebSocket gateways, introduced only when a core or later epic requires real-time features.
- Runtime/infrastructure (MVP): Docker Compose locally (PostgreSQL + Mailpit); production on a single VPS with Docker Compose + Caddy; email through an SMTP provider behind an email port; GitHub Actions for CI. AWS (EC2/ECR/S3/SES/CloudWatch/SSM), Terraform and GitHub Actions OIDC are deferred to a future ADR.
- Determine tool versions from pinned repository files; do not guess versions.

## 3. Architecture Rules

1. Follow the modular monolith and DDD-lite approach; do not introduce microservices or new infrastructure components without an approved ADR.
2. `apps/web` owns the Next.js UI and thin BFF; `apps/api` is the sole authority for authentication, authorization, and business rules.
3. The browser receives only a random opaque session identifier in a secure HttpOnly cookie. Access JWTs and opaque refresh tokens remain server-side in the BFF session store. Never expose them to Client Components, localStorage, or browser-visible responses.
4. PostgreSQL has logically separate schemas, `app` (NestJS) and `bff` (Next.js), with separate database credentials and migration ownership. Neither application may access the other's private tables.
5. The OpenAPI-generated NestJS client is server-only. The browser communicates with the same-origin Next.js BFF, never directly with the private NestJS API.
6. Backend modules expose minimal application contracts within `apps/api`. Direct imports of other modules' repositories, infrastructure, or domain entities are prohibited. Exchange IDs, commands, and DTOs/read models, not Prisma-generated models.
7. Inter-module dependencies must be unidirectional; application workflows coordinate cross-module use cases. Do not use `forwardRef()` to conceal architectural cycles.
8. The domain layer must not depend on NestJS, Prisma, HTTP, or UI. Infrastructure implements ports, not the other way around.
9. A use case that must be atomic across modules (e.g. registration: User + personal Workspace + OWNER Membership + outbox event) runs in one Unit of Work and one PostgreSQL transaction, coordinated from `workflows/`. Do not replace such an invariant with an asynchronous event handler.
10. External side effects (including email delivery) occur after commit through a transactional outbox with retry and idempotency semantics.
11. Start API contract changes by aligning OpenAPI/DTO definitions; do not create parallel, incompatible contracts in web and api.
12. Document proposed changes to security boundaries, module ownership, data ownership, or deployment topology in a proposed ADR and obtain approval before implementing them.
13. Socket.IO is planned, not a baseline dependency; introduce it only through an approved ADR that keeps rules 3 and 5 intact.

## 4. Repository Structure

The structure below is a **target guideline**, not a requirement to create every directory immediately. Create a directory only when a corresponding use case arises. Do not change approved boundaries merely to simplify imports. Internal structure and rules of each app: `apps/web/AGENTS.md`, `apps/api/AGENTS.md`.

```text
archipelago/
├── apps/
│   ├── web/                    # Next.js: UI + thin BFF
│   └── api/                    # NestJS: modular monolith
├── packages/
│   ├── api-client/             # OpenAPI-generated, server-only
│   ├── shared/                 # Minimal framework-independent utilities
│   └── config/                 # Shared TS / ESLint / Prettier configs
├── infra/
│   ├── docker/
│   └── terraform/              # Deferred: only after an approved infrastructure ADR
├── docs/
│   ├── architecture/
│   ├── adr/
│   ├── epics/
│   └── runbooks/
└── .github/workflows/
```

### 4.1. Shared Packages and Dependency Rules

- `packages/api-client`: generated HTTP contracts/client and required transport types only; server-only for `apps/web`, with no imports from `apps/api` source files.
- `packages/shared`: minimal framework-independent types and utilities; do not move backend module contracts, Prisma models, auth/session logic, or domain services here.
- `packages/config`: TypeScript, ESLint, and Prettier configurations; no runtime business dependencies.
- `apps/web` and `apps/api` must not import each other's source files. Their runtime interaction is through HTTP/OpenAPI.
- Use package exports; do not bypass boundaries using TypeScript path aliases or deep imports.
- Individual feature or module structures may be simplified as long as ownership and dependency rules remain intact.

## 5. Coding Conventions

- Enable TypeScript `strict`; do not use `any` to bypass type checking without justification.
- Follow existing formatter, lint rules, naming conventions, and package exports; do not change them without approval.
- Add dependencies only when there is a demonstrated need; use pnpm and the workspace protocol for internal packages.
- Keep changes minimal and localized; do not refactor unrelated modules unless requested.
- Validate untrusted input at server boundaries; frontend validation does not replace backend validation.
- NestJS DTOs use `class-validator` for transport validation with explicitly configured options; library defaults are not an approved business policy.
- `apps/web` mirrors server validation with React Hook Form + Zod for immediate feedback only; NestJS stays authoritative. Do not import NestJS DTO source into `apps/web`; a rule implemented on both sides has shared test vectors (§6).
- Do not edit generated code by hand (`packages/api-client`, Prisma client); change the source (OpenAPI, `schema.prisma`) and regenerate.
- Conventions not decided yet (API error format, pagination, ID strategy, date/time handling, logging format) are not invented per story: propose options and ask (§8.2).
- Keep public comments and documentation aligned with behavior; do not restate obvious code.
- Write concise, idiomatic code that a person reads easily: clear names over comments, small functions/components with one job, no speculative abstractions, options or layers the story does not need.

## 5.1. Product Rules — Where They Live

- Business rules, flows and acceptance criteria live in the product documents, not here: `docs/product/archipelago-business-requirements.md` (BRD), `docs/product/Archipelago_PRD_v1.2.md`, `docs/epics/EPIC-*.md`. Precedence on conflict: BRD → epic → PRD.
- Read the BRD rules and the epic referenced by a story before designing or implementing it; quote rule IDs (BR-, FR-, epic AC IDs) in artifacts.
- UI follows `docs/design/README.md`; mockups are visual references and the listed corrections win over them. Do not infer new features, limits or fields from mockups, placeholder directories or infrastructure.
- A product decision that is missing or conflicting is raised to the owner, never decided in code.

## 6. Testing Strategy

Commands (repository root; Turborepo runs them per package, `--filter <package>` narrows):

| Purpose                                             | Command                                                  |
| --------------------------------------------------- | -------------------------------------------------------- |
| Lint / typecheck / unit + integration tests / build | `pnpm lint`, `pnpm typecheck`, `pnpm test`, `pnpm build` |
| Local PostgreSQL + Mailpit                          | `pnpm db:up` (`db:down`, `db:reset`)                     |
| API integration tests (`*.int-spec.ts`, needs DB)   | `pnpm --filter @archipelago/api test:int`                |
| API e2e tests                                       | `pnpm --filter @archipelago/api test:e2e`                |
| Prisma client                                       | `pnpm --filter @archipelago/api prisma:generate`         |

- Business-rule changes require unit tests; Prisma transactions, authorization, session lifecycle, and outbox behavior require integration tests.
- `apps/web` uses Vitest + Testing Library (ADR-001): test pure functions, Zod schemas, custom hooks (`renderHook`), components with behavior, and BFF route handlers.
- For REST contract changes, verify consistency between OpenAPI and the generated client.
- A validation rule implemented in both Zod and `class-validator` is tested with the same accept/reject vectors on both sides, including boundaries and Unicode. The vectors live in `@archipelago/shared/validation-vectors`; the api story writes them, the web story imports them ([ADR-004](docs/adr/ADR-004-shared-validation-vectors.md)).
- For module-boundary changes, run architecture/dependency checks; circular dependencies are not permitted.
- Never claim checks passed unless you ran them. Report the exact commands, results, and environment limitations.
- Do not modify or delete tests merely to conceal a defect.

## 7. Security Rules

- Do not commit secrets, credentials, tokens, private keys, or production `.env` files; use placeholders in examples.
- Only NestJS handles passwords and stores only adaptive password hashes (algorithm and parameters per the approved ADR).
- Never log or send to analytics: passwords, access/refresh tokens, session identifiers, verification/reset tokens, OAuth codes or ID tokens, Reflection text. Identify users in logs by ID, not by email or name.
- NestJS enforces authorization for every protected resource; UI visibility is not authorization.
- Cookie-based BFF routes must account for CSRF, XSS, session fixation, expiration, and logout/revocation.
- Do not bypass database grants or server-only boundaries to speed up implementation.
- Do not change IAM, secrets, production deployment, or database migrations without a separate task-appropriate review.

## 8. Agent Workflow & Definition of Done

**Delivery harness.** Feature work goes through the workflow in `docs/workflow/`: `stage-map.yaml` (stages, routing, gates — normative), `artifact-paths.yaml` (where artifacts live, who writes them), `artifact-lifecycle.md`, `artifact-schema.md`, `state-schema.md`; `stages.md` explains them. One epic at a time is cut into small single-layer (`api` or `web`) stories under `docs/stories/epic-<nn>/`; one story at a time goes from an interactive clarification to human acceptance. Skills live in `.claude/skills/`, commands in `.claude/commands/so/` (`/so:epic`, `/so:start`, `/so:run`, `/so:next`, `/so:status`, `/so:approve`, `/so:reject`). `/so:run` drives the story stage by stage, each in a fresh subagent, and stops only where a human is needed; `/so:next` does one stage. Only `story-orchestrator` writes workflow state and touches Git: each epic runs on a local branch `epic/<nn>-<slug>` from `dev`, each accepted story is one commit there (`feat(<layer>): <title> (<StoryId>)`), and the accepted epic is merged `--no-ff` into `dev` and pushed (`docs/workflow/stage-map.yaml` → `git`). A review `PASS` is never human approval.

**Promoting agreements.** A convention a story settles that later stories must follow (a pattern, a test level, a config rule) moves into `apps/<layer>/docs/<layer>-patterns.md`, this file or an ADR at that story's `HUMAN_ACCEPTANCE`; story artifacts are working files, not the place future work looks for rules.

1. Before making changes, read relevant `AGENTS.md` files, ADRs, task acceptance criteria, and existing implementations.
2. If a decision is unapproved or requirements conflict, present options and request approval; do not invent architectural decisions.
3. Before implementation, briefly identify scope, dependencies, risks, and checks; propose a plan for substantial changes.
4. Modify only files within task scope; do not create application code when only design or documentation was requested.
5. Before reporting done, run `pnpm lint`, `pnpm typecheck` and `pnpm test` for every changed package (and `pnpm build` before a PR); a check that cannot run is reported as not run, with the reason.
6. Summarize changed areas, check results, unresolved questions, and risks.
7. A task is complete only when every acceptance criterion is covered by a test or an explicit, stated reason, and outstanding unverified items are listed.

## 9. Prohibited Actions

- Do not violate approved ADRs without a newly approved decision.
- Do not import Prisma repositories or private files from other business modules.
- Do not use direct browser-to-NestJS authentication flows that violate the BFF boundary.
- Do not run destructive migrations, production deployments, data deletion, or IAM changes without explicit authorization.
- Do not introduce Redis, Kafka, Kubernetes, microservices, or other major components without architectural approval.

## 10. Reference Documents

- Product: BRD, PRD v1.2, `docs/epics/` (§5.1); design: `docs/design/README.md`.
- Established patterns: `apps/api/docs/api-patterns.md`, `apps/web/docs/web-patterns.md`.
- Architecture decisions: `docs/adr/` (only `Accepted` ADRs are binding; `Proposed` ones need approval before implementation), `docs/architecture/`.
- Delivery workflow: `docs/workflow/`; stories: `docs/stories/`; operations: `docs/runbooks/`.
- If a referenced document does not exist, report its absence instead of assuming its content.
