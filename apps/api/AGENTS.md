# AGENTS.md — `apps/api` (NestJS modular monolith)

Rules for work inside `apps/api`. The root [`AGENTS.md`](../../AGENTS.md) applies as well and wins on conflict.

## Structure

Target guideline: create a directory only when a use case needs it.

```text
apps/api/
├── src/
│   ├── main.ts
│   ├── app.module.ts           # Composition root
│   ├── modules/
│   │   ├── identity/
│   │   │   ├── contracts/      # Published application interfaces / DTOs
│   │   │   ├── application/    # Use cases, ports, orchestration within module
│   │   │   ├── domain/         # Entities, value objects, invariants
│   │   │   ├── infrastructure/ # Prisma adapters, external implementations
│   │   │   └── presentation/   # REST controllers, request/response DTOs
│   │   ├── workspaces/
│   │   ├── projects/
│   │   ├── goals/
│   │   ├── focus/
│   │   ├── contributions/
│   │   ├── reflections/
│   │   ├── analytics/
│   │   └── ai-insights/        # Only when this functionality is introduced
│   ├── workflows/
│   │   └── registration/       # User + personal Workspace + outbox
│   ├── infrastructure/
│   │   ├── database/           # Prisma + Unit of Work implementation
│   │   ├── outbox/             # Persistence / processing adapters
│   │   └── email/              # Email port + SMTP adapter (Mailpit locally)
│   └── common/                 # Technical cross-cutting concerns only
├── prisma/                    # app schema/migrations only
└── ...                        # NestJS, testing, and toolchain configurations
```

## Backend rules

- Each module owns its business rules and persistence adapters. Do not import another module's `infrastructure/`, repositories, Prisma models, or domain entities.
- `contracts/` is the minimal published interface for other modules; it contains application interfaces and small DTOs/read models, not NestJS controllers or Prisma-generated types.
- `presentation/` maps HTTP requests and responses, performs validation, and invokes application use cases; it must not contain domain rules or direct Prisma queries.
- `application/` coordinates use cases and invokes domain rules and ports; `domain/` must not depend on NestJS, Prisma, HTTP, or infrastructure.
- `infrastructure/` implements persistence and external ports. Dependencies point toward application/domain abstractions, never the reverse.
- `workflows/` coordinates cross-module scenarios through `contracts/`; atomic operations use one Unit of Work. Modules must not import workflows back into themselves.
- `common/` is not a place for shared business logic or bypassing module boundaries. New shared abstractions require at least two concrete use cases.
- The HTTP API is versioned under `/api/v1`; OpenAPI is the contract source for the generated client. DTO and endpoint changes must maintain contract consistency.
- NestJS `prisma/` manages only the `app` schema. The backend must not read or modify `bff` session tables.
- Circular module imports, `forwardRef()` as a workaround for cycles, and direct access to other modules' repositories are prohibited.

## Framework notes (generated, not project decisions)

The notes below come from the NestJS project template. They describe the framework, not choices made for Archipelago:

- Persistence is **Prisma** (root §2). The TypeORM/Drizzle/Mongoose/Sequelize packages listed below are not used.
- Request DTO validation is **`class-validator`** (root §5). Standard Schema pipes are not used without an ADR.
- Packages such as `@nestjs/outbox`, `@nestjs/throttler` or `@nestjs/i18n` are candidates only. Adopting one is a decision recorded in the story plan or an ADR.
- **NestJS Observe** (telemetry and its MCP server) is **not adopted**. Do not run `npx @nestjs/observe link` or add `ObserveModule` without an approved ADR (root §3.1, §9).
- Still valid: the project is ESM (relative imports end in `.js`, use `import.meta.dirname`), and tests run on Vitest (`vi.fn()`).

### NestJS

This app's version of NestJS is likely newer than what you know. https://docs.nestjs.com/llms.txt indexes its documentation, with a markdown page per chapter.

Nest has first-party packages for these, so check them before adding another library or writing your own:

- Databases: [`@nestjs/typeorm`](https://docs.nestjs.com/data/typeorm.md), [`@nestjs/drizzle`](https://docs.nestjs.com/data/drizzle.md), [`@nestjs/mongoose`](https://docs.nestjs.com/data/mongodb.md), [`@nestjs/sequelize`](https://docs.nestjs.com/data/sequelize.md).
- OpenAPI: [`@nestjs/swagger`](https://docs.nestjs.com/openapi/introduction.md). GraphQL: [`@nestjs/graphql`](https://docs.nestjs.com/graphql/quick-start.md). WebSockets: [`@nestjs/websockets`](https://docs.nestjs.com/websockets/gateways.md). Microservices: [`@nestjs/microservices`](https://docs.nestjs.com/microservices/basics.md).
- Sign-in: [`@nestjs/authentication`](https://docs.nestjs.com/security/authentication.md). Permissions: [`@nestjs/authorization`](https://docs.nestjs.com/security/authorization.md). Rate limiting: [`@nestjs/throttler`](https://docs.nestjs.com/security/rate-limiting.md).
- Configuration: [`@nestjs/config`](https://docs.nestjs.com/application/configuration.md). Caching: [`@nestjs/cache-manager`](https://docs.nestjs.com/data/caching.md). Health checks: [`@nestjs/terminus`](https://docs.nestjs.com/reliability/terminus.md). Events inside the app: [`@nestjs/event-emitter`](https://docs.nestjs.com/application/events.md).
- Email: [`@nestjs/mail`](https://docs.nestjs.com/application/mail.md). Files, S3 included: [`@nestjs/storage`](https://docs.nestjs.com/application/file-storage.md). Translations: [`@nestjs/i18n`](https://docs.nestjs.com/application/i18n.md).
- Retries, timeouts and circuit breakers: [`@nestjs/resilience`](https://docs.nestjs.com/reliability/resilience.md).
- Idempotency keys: [`@nestjs/idempotency`](https://docs.nestjs.com/reliability/idempotency.md). Transactional outbox: [`@nestjs/outbox`](https://docs.nestjs.com/reliability/outbox.md). Sending and receiving webhooks: [`@nestjs/webhooks`](https://docs.nestjs.com/http/webhooks.md).
- Queues: [`@nestjs/bullmq`](https://docs.nestjs.com/application/queues.md). Scheduled jobs: [`@nestjs/schedule`](https://docs.nestjs.com/application/task-scheduling.md).
- Running a scheduled job on one instance, and locks: [`@nestjs/locks`](https://docs.nestjs.com/reliability/locks.md). Processes that take days: [`@nestjs/workflows`](https://docs.nestjs.com/reliability/workflows.md).
- Language models, tools and agents: [`@nestjs/ai`](https://docs.nestjs.com/ai/overview.md). MCP servers: [`@nestjs/mcp`](https://docs.nestjs.com/mcp/overview.md).

Validation works with Zod, Valibot, ArkType or any other Standard Schema library, with no classes or decorator metadata: `StandardSchemaValidationPipe` with `@Body({ schema })` or `@Param('id', { schema })` (https://docs.nestjs.com/application/validation.md). `class-validator` still works, through `ValidationPipe`.

`NodeAdapter` from `@nestjs/platform-node` is the fastest HTTP adapter, ahead of Fastify (https://docs.nestjs.com/http/performance.md).

Nest's packages are ESM only, and this project is ESM too: relative imports end in `.js`, `__dirname` doesn't exist (use `import.meta.dirname`), and tests run on Vitest, so mocks are `vi.fn()`, not `jest.fn()`.

### Production data: NestJS Observe (not adopted, see above)

This app's production telemetry - traces, errors, logs and metrics - goes to [NestJS Observe](https://observe.nestjs.com). Until `ObserveModule` is registered in `src/app.module.ts`, nothing is sent: `npx @nestjs/observe link` sets it up in one step - it installs `@nestjs/observe`, wires it into the app, and writes the key pair (`OBSERVE_APP_KEY`, `OBSERVE_APP_SECRET`) to `.env`.

When a task depends on how the app behaves in production - an error users hit, a slow endpoint, a failing job, whether a release made things worse - work from that data, not from the code alone:

- The Observe MCP server answers those questions directly: errors with their traces and logs, slow operations, jobs, and what a release changed (`find_regressions`, `diff_release`). It is included on the Pro plan and above. In Claude Code: `claude mcp add observe --transport http https://observe-api.nestjs.com/mcp`, and the client opens a browser to approve. Other clients: https://www.observe.nestjs.com/documentation/mcp
- Without it, the user can open the request or error in the Observe dashboard and click **Copy agent prompt**, which hands over that page's trace, stack and logs as text.
