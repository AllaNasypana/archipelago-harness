# @archipelago/api

NestJS **modular monolith** for Archipelago: the single authority for authentication,
authorization and business rules. It is private — only the Next.js BFF
([`apps/web`](../web/README.md)) calls it, through the generated `@archipelago/api-client`.

Read first: root [`AGENTS.md`](../../AGENTS.md) §3, §4.2, §5–7. The local [`AGENTS.md`](AGENTS.md)
lists NestJS first-party packages to check before adding a library.

## Architecture

REST API under `/api/v1`, documented with OpenAPI (`@nestjs/swagger`); request DTOs are validated
with `class-validator`. ESM (`"type": "module"`).

```text
src/
├── main.ts, app.module.ts       # bootstrap + composition root
├── modules/<module>/            # identity, workspaces, projects, goals, focus,
│   ├── contracts/               #   contributions, reflections, analytics
│   ├── application/             # use cases, ports
│   ├── domain/                  # entities, invariants — no NestJS/Prisma/HTTP
│   ├── infrastructure/          # Prisma adapters, external implementations
│   └── presentation/            # controllers, request/response DTOs
├── workflows/registration/      # cross-module use cases (User + Workspace + OWNER + outbox)
├── infrastructure/
│   ├── database/                # Prisma client (generated/ is git-ignored) + Unit of Work
│   ├── outbox/                  # transactional outbox
│   └── email/                   # email port + SMTP adapter (Mailpit locally)
└── common/                      # technical cross-cutting concerns only
```

Rules in short:

- Other modules are reached only through their `contracts/`; never import another module's
  `infrastructure/`, repositories, Prisma models or domain entities.
- Module dependencies are one-way; no `forwardRef()` to hide cycles.
- External side effects (email) run after commit via the outbox.

## Database (Prisma 7)

- Owns PostgreSQL schema **`app`** only, connecting as `app_user`; it never touches schema `bff`.
- Schema: `prisma/schema.prisma`; migrations: `prisma/migrations/`; config: `prisma7.config.ts`
  (reads `DATABASE_URL` from `.env`).
- The client is generated into `src/infrastructure/database/generated/prisma`.
- No models yet — they are added per approved story. Migrations need a task-appropriate review
  (AGENTS.md §7).

```bash
cp .env.example .env          # set APP_DB_PASSWORD from the root .env
pnpm prisma:generate
pnpm exec prisma migrate dev  # once models exist
```

## Commands

Run from this folder or with `pnpm --filter @archipelago/api <script>`:

| Command                                           | What it does                                           |
| ------------------------------------------------- | ------------------------------------------------------ |
| `pnpm dev`                                        | Watch mode on http://localhost:3001 (`PORT` overrides) |
| `pnpm build` / `pnpm start:prod`                  | Compile to `dist/` / run the build                     |
| `pnpm lint`                                       | oxlint (type-aware)                                    |
| `pnpm typecheck`                                  | `tsc --noEmit`                                         |
| `pnpm test` / `pnpm test:watch` / `pnpm test:cov` | Vitest unit tests                                      |
| `pnpm test:e2e`                                   | Vitest e2e (`vitest.config.e2e.ts`)                    |
| `pnpm prisma:generate`                            | Generate the Prisma client                             |

Testing expectations: unit tests for business rules; integration tests for Prisma transactions,
authorization, sessions and outbox (AGENTS.md §6).

Setup of Docker, env files and the database is in the [root README](../../README.md#getting-started).
