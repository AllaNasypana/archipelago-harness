# Archipelago

Personal-first web app for aligning invested time with chosen priorities through the loop
**Choose Focus → Invest Time → Reflect → Adjust**. Users organise Projects and Goals, pick 1–5
Focus Goals per week, log time as Contributions, track progress separately, compare plan vs.
actual, and close each week with a reflection and irreversible finalization.

The repository is also the reference project for an artifact-driven agentic SDLC: every change is
traced to approved requirements. Agents must read [`AGENTS.md`](AGENTS.md) first.

## Documentation

| What                                                                        | Where                                                                                                    |
| --------------------------------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| Agent rules, architecture boundaries, coding conventions                    | [`AGENTS.md`](AGENTS.md)                                                                                 |
| Business requirements (approved, v1.0) — resolves conflicts between sources | [`docs/product/archipelago-business-requirements.md`](docs/product/archipelago-business-requirements.md) |
| Product requirements (PRD v1.2)                                             | [`docs/product/Archipelago_PRD_v1.2.md`](docs/product/Archipelago_PRD_v1.2.md)                           |
| Epic specifications EPIC-01…08                                              | [`docs/epics/`](docs/epics/)                                                                             |
| Desktop mockups by epic (visual reference; specs win on conflict)           | [`docs/design/`](docs/design/README.md)                                                                  |
| Architecture notes, ADRs, runbooks                                          | `docs/architecture/`, `docs/adr/`, `docs/runbooks/` (empty for now)                                      |

Precedence when documents disagree: approved epics → BRD → PRD → AGENTS.md product summary.

## Tech stack

- **Monorepo:** pnpm workspaces, Turborepo, TypeScript 6 (`strict`)
- **Web (`apps/web`):** Next.js 16 App Router + thin BFF, React 19, Tailwind CSS 4, TanStack Query,
  Zustand (UI state only), React Hook Form + Zod
- **API (`apps/api`):** NestJS 12 modular monolith, REST `/api/v1`, OpenAPI (`@nestjs/swagger`),
  `class-validator`, Prisma 7 + PostgreSQL
- **Local infrastructure:** Docker Compose — PostgreSQL 18, Mailpit (SMTP catcher)

Exact versions are pinned in the `package.json` files and `pnpm-lock.yaml`.

## Repository layout

```text
archipelago/
├── apps/
│   ├── web/                # Next.js UI + thin BFF (owns PostgreSQL schema `bff`)
│   └── api/                # NestJS modular monolith (owns PostgreSQL schema `app`)
│       ├── src/modules/    # identity, workspaces, projects, goals, focus,
│       │                   # contributions, reflections, analytics
│       │                   #   each: contracts/ application/ domain/ infrastructure/ presentation/
│       ├── src/workflows/  # cross-module use cases (registration)
│       ├── src/infrastructure/  # database (Prisma), outbox, email
│       └── prisma/         # schema for `app` only
├── packages/
│   ├── api-client/         # OpenAPI-generated client, server-only (placeholder)
│   ├── shared/             # minimal framework-independent utilities
│   └── config/             # shared tsconfig
├── infra/docker/           # docker-compose.yml + DB init scripts
├── docs/                   # product, epics, design (mockups), architecture, adr, runbooks
└── .github/workflows/      # CI (to be added)
```

Empty directories hold a `.gitkeep`; per `AGENTS.md`, fill them only when a story needs them.

## Prerequisites

- Node.js ≥ 24 (see `.nvmrc`)
- pnpm 10 (`corepack enable` or a global install)
- Docker Desktop (or another Docker engine with Compose v2)

## Getting started

```bash
# 1. Install dependencies
pnpm install

# 2. Create local env files and replace the placeholder passwords
cp .env.example .env
cp apps/api/.env.example apps/api/.env   # use APP_DB_PASSWORD from the root .env

# 3. Start PostgreSQL + Mailpit (waits until healthy)
pnpm db:up

# 4. Generate the Prisma client
pnpm --filter @archipelago/api prisma:generate

# 5. Run web and api in watch mode
pnpm dev
```

| Service           | URL                                      |
| ----------------- | ---------------------------------------- |
| Web (Next.js)     | http://localhost:3000                    |
| API (NestJS)      | http://localhost:3001                    |
| PostgreSQL        | `127.0.0.1:5432`, database `archipelago` |
| Mailpit UI / SMTP | http://127.0.0.1:8025 / `127.0.0.1:1025` |

Docker ports are bound to `127.0.0.1` only.

## Database

One PostgreSQL database, two isolated schemas (`AGENTS.md` §3, rule 4):

| Schema | Owner role | Used by                                | Migrations                      |
| ------ | ---------- | -------------------------------------- | ------------------------------- |
| `app`  | `app_user` | NestJS (`apps/api`)                    | `apps/api/prisma`               |
| `bff`  | `bff_user` | Next.js BFF session store (`apps/web`) | `apps/web/prisma` (when needed) |

- Each role can only use its own schema; neither can access the other's schema or `public`.
- Roles and schemas are created by `infra/docker/initdb/01-schemas-and-roles.sh` on the **first**
  start of an empty volume. After changing passwords in `.env`, recreate the volume with `pnpm db:reset`.
- `app_user` has `CREATEDB` for Prisma's shadow database (development only).
- No Prisma models exist yet; they are added per approved story.

## Scripts (repo root)

| Command                       | What it does                                          |
| ----------------------------- | ----------------------------------------------------- |
| `pnpm dev`                    | Run web and api in watch mode (Turborepo)             |
| `pnpm build`                  | Build all packages and apps                           |
| `pnpm typecheck`              | Type-check everything (web runs `next typegen` first) |
| `pnpm lint`                   | ESLint (web) and oxlint (api)                         |
| `pnpm test`                   | Unit tests (Vitest in api)                            |
| `pnpm format`                 | Prettier                                              |
| `pnpm db:up` / `pnpm db:down` | Start / stop PostgreSQL and Mailpit                   |
| `pnpm db:logs`                | Follow container logs                                 |
| `pnpm db:psql`                | Open `psql` as the superuser                          |
| `pnpm db:reset`               | **Destroys the database volume** and starts fresh     |

Run a script in one workspace with `pnpm --filter @archipelago/api <script>` (or `@archipelago/web`).

## Security notes

- `.env` files are git-ignored; commit only `.env.example` with placeholders.
- The browser never receives access/refresh tokens; it only gets an opaque HttpOnly session cookie
  from the Next.js BFF. NestJS is the sole authority for authentication, authorization and business rules.
- See `AGENTS.md` §7 and §9 for the full rules and prohibited actions.

## Agent skills

`apps/api/.claude/skills` contains two vendor reference skills (`prisma-cli`, `prisma-client-api`),
tracked in `apps/api/skills-lock.json`. Project workflow skills for the delivery harness are not added yet.
