# @archipelago/web

Next.js App Router UI plus a **thin BFF** (backend-for-frontend) for Archipelago.
Business rules, authentication and authorization live in [`apps/api`](../api/README.md);
this app renders pages and proxies browser calls to NestJS.

Read first: root [`AGENTS.md`](../../AGENTS.md) §3–4.1. The local [`AGENTS.md`](AGENTS.md) holds the
Next.js version notes that `next dev` writes.

## Boundaries

- The browser talks only to same-origin BFF Route Handlers in `src/app/api/`, never to NestJS directly.
- The browser gets only an opaque HttpOnly session cookie. Access/refresh tokens stay server-side
  in the BFF session store (PostgreSQL schema `bff`, role `bff_user`).
- `src/lib/api`, `src/lib/auth`, `src/lib/db` are **server-only**. `lib/db` never reads schema `app`.
- NestJS DTO source is never imported here. The generated client comes from `@archipelago/api-client`.
- TanStack Query holds server state; Zustand only for UI state; React Hook Form + Zod for forms
  (mirrors the API validation rules, the API stays authoritative).

## Layout

```text
src/
├── app/
│   ├── (public)/       # public pages
│   ├── (auth)/         # login, registration, recovery; centered layout, no sidebar
│   ├── (protected)/    # authenticated pages inside the app shell
│   └── api/            # BFF Route Handlers: browser → Next.js → NestJS
├── features/           # auth, workspaces, projects, goals, focus,
│                       # contributions, reflections, analytics
├── components/ui/      # shadcn/ui primitives
├── components/layout/  # app shell: header, sidebar, profile menu
├── lib/{api,auth,db,utils}
├── styles/             # theme.css (tokens), components.css (shared classes)
├── providers/          # TanStack Query and other client providers
└── types/              # UI-only types (not copies of API DTOs)
```

Route groups are just folders: they do **not** protect anything by themselves.

Patterns for routing, URL state, streaming and errors: [`docs/web-patterns.md`](docs/web-patterns.md).

Code principles (feature-based structure, UI/logic separation, hooks, composition patterns,
naming, App Router practices, accessibility) are in root [`AGENTS.md`](../../AGENTS.md) §4.1
"Web code principles" — read them before writing web code.

## Styles

- `src/styles/theme.css` — the only place for colors, radii and fonts. Token names follow
  shadcn/ui (`primary`, `muted-foreground`, `border`, …) plus `success`/`warning`/`info` and their
  `-soft` backgrounds. Use them through Tailwind utilities (`bg-primary`, `text-muted-foreground`);
  never hard-code hex values in components.
- `src/styles/components.css` — a few shared classes for patterns that repeat on many screens:
  `page-title`, `page-subtitle`, `card`, `section-title`, `badge` + `badge-*`, `numeric`.
  Add a class only after the pattern appears 3+ times; buttons, inputs, dialogs and tabs are
  React components in `src/components/ui`.
- Light theme only; fonts are Geist Sans/Mono with Latin and Cyrillic subsets.

## UI references

- App shell (header, sidebar, profile menu with Log out): only
  [`docs/design/mockups/general/`](../../docs/design/README.md#app-shell--the-only-correct-layout).
- Page content per epic: [`docs/design/README.md`](../../docs/design/README.md). When a mockup and an
  epic disagree, the epic wins.
- Light theme only; English (`en`, default) and Ukrainian (`uk`) are both required for the MVP —
  keep all UI strings externalized.

## Commands

Run from the repo root (`pnpm dev` starts web and api together) or here:

| Command                                     | What it does                            |
| ------------------------------------------- | --------------------------------------- |
| `pnpm --filter @archipelago/web dev`        | Dev server on http://localhost:3000     |
| `pnpm --filter @archipelago/web build`      | Production build                        |
| `pnpm --filter @archipelago/web start`      | Serve the production build              |
| `pnpm --filter @archipelago/web lint`       | ESLint                                  |
| `pnpm --filter @archipelago/web typecheck`  | `next typegen` + `tsc --noEmit`         |
| `pnpm --filter @archipelago/web test`       | Vitest: logic, hook and component tests |
| `pnpm --filter @archipelago/web test:watch` | Vitest in watch mode                    |

Tests: `*.spec.ts(x)` next to the code, Vitest + Testing Library (`render`, `renderHook`, `user-event`,
jest-dom matchers). What to test is in [ADR-001](../../docs/adr/ADR-001-web-testing.md).

Setup of the database, env files and Docker is in the [root README](../../README.md#getting-started).
