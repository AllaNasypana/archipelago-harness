# AGENTS.md — `apps/web` (Next.js UI + thin BFF)

Rules for work inside `apps/web`. The root [`AGENTS.md`](../../AGENTS.md) applies as well and wins on conflict.
The generated Next.js block at the end of this file is tooling guidance about the framework version, not a project rule.

**Patterns:** [`docs/web-patterns.md`](docs/web-patterns.md) is binding for web implementation and review — React Compiler, `proxy.ts`, URL-addressable dialogs, URL filter state, Context, Suspense/transitions, the BFF error format, file roles, styles and localization.

## Structure

Target guideline: create a directory only when a use case needs it.

```text
apps/web/
├── src/
│   ├── app/
│   │   ├── [locale]/           # Every UI route lives under the locale segment (D-01-10)
│   │   │   ├── (public)/       # Public routes
│   │   │   ├── (auth)/         # Login / registration / recovery UI
│   │   │   ├── (protected)/    # Authenticated pages
│   │   │   ├── layout.tsx      # Root layout: <html lang>, i18n Provider
│   │   │   └── page.tsx
│   │   ├── api/                # BFF Route Handlers: browser → Next.js → NestJS (not localized)
│   │   └── global-not-found.tsx
│   ├── features/               # Inside a feature: see "File roles"
│   │   ├── i18n/
│   │   ├── auth/
│   │   ├── workspaces/
│   │   ├── projects/
│   │   ├── goals/
│   │   ├── focus/
│   │   ├── contributions/
│   │   ├── reflections/
│   │   └── analytics/
│   ├── components/
│   │   ├── ui/                 # shadcn/ui primitives
│   │   └── layout/             # Shared layout components
│   ├── lib/
│   │   ├── api/                # Server-only NestJS client adapters
│   │   ├── auth/               # BFF session handling; server-only
│   │   ├── db/                 # Access exclusively to PostgreSQL schema bff
│   │   └── utils/
│   ├── hooks/                  # Hooks used by ≥2 features
│   ├── styles/                 # theme.css (design tokens), components.css (shared classes)
│   ├── providers/              # TanStack Query and other client providers
│   └── types/                  # Types used by ≥2 features; not duplicates of API DTOs
├── prisma/                    # BFF session schema/migrations only, when needed
└── ...                        # Next.js, testing, and toolchain configurations
```

## Web rules

- `app/` handles routing, layouts, Server Components, and composition; do not move NestJS business rules into it.
- `features/<feature>/` groups feature-local UI, hooks, forms, UI Zod schemas, TanStack Query hooks, and mutations. Do not create every subdirectory from a template unless needed.
- `components/ui/` contains reusable UI primitives; feature-specific components remain within their respective features.
- `lib/auth/` and `lib/db/` are **server-only**. The BFF session identifier is stored in a cookie; JWTs and refresh tokens are stored only in the server-side session store.
- `lib/db/` must not read the `app` schema; BFF migrations must not manage NestJS tables.
- `lib/api/` uses `packages/api-client` only on the server. Client Components call same-origin BFF Route Handlers, not NestJS directly.
- TanStack Query manages browser-side server state; use Zustand only for justified client/UI state. Do not duplicate the same data across both stores.
- Server Components may fetch authenticated data through a server-side adapter; never pass tokens through props, hydration payloads, or client caches.
- Private SSR data must not enter shared/public caches. Cookie mutations and browser session lifecycle operations must occur only in permitted server response contexts.
- Route groups `(public)`, `(auth)`, and `(protected)` are organizational names; they do not provide access control by themselves.

## Web code principles

A pattern is used only when it removes real complexity.

- **Feature-based architecture:** code for a feature lives in `features/<feature>/` (components, hooks, schemas, queries); `app/` routes only compose features. Shared code moves to `components/`, `hooks/`, `types/` or `lib/` only after a second feature needs it. Features do not import each other's internals: `app/`, `proxy.ts` and other features import a feature only through its `index.ts`.
- **File roles** (details and example: [`web-patterns.md` §8](docs/web-patterns.md#8-file-roles)):
  - UI files (`page.tsx`, `layout.tsx`, components) contain only UI: markup, the hook call, trivial inline handlers (`onClick={() => onSelect(id)}`), conditional rendering, `map`.
  - State, effects, handlers with side effects (async, navigation, mutations) and derived values beyond one expression live in a hook (`hooks/use-<name>.ts`).
  - Pure helpers live in `utils/`; Server Functions (`'use server'`) in `actions/`; Zod schemas in `schemas/`; constants in `constants.ts`.
  - Types and interfaces live in the feature's `types.ts`; only a component's own `<Component>Props` stays next to it. A type used by ≥2 features moves to `src/types/<name>.ts`.
  - `page.tsx` / `layout.tsx` only compose: `await params`, one call to a feature helper (which calls `notFound()` / `redirect()` itself), render feature components or static markup with message texts.
  - Subfolders are created only when they have a file.
- **DRY, KISS, separation of concerns:** one home for each style, type, schema and string; the simplest solution that meets the acceptance criteria; no premature abstraction or configuration.
- **UI / logic separation:** components render and handle events; non-trivial client behavior lives in hooks and pure functions; server data access lives in `lib/api` and BFF route handlers. Business rules stay in NestJS — the web never re-implements them, it only mirrors validation for fast feedback.
- **Custom hooks** (`use-<name>.ts`, exported as `useName`) for reusable client behavior: TanStack Query queries/mutations per feature, form wiring, UI state. A hook has one purpose and returns a small, typed API.
- **Composition patterns when appropriate:** Compound Components for related parts sharing state (tabs, dialog, data table); Render Props only when the caller must control rendering and children/composition is not enough; Providers for cross-cutting client state (query client, i18n, session view); Layouts (`layout.tsx`) for shared shells such as the app shell and the centered auth layout.
- **Strict TypeScript and naming:** `strict`, no `any`, no non-null assertions to silence errors; types inferred from Zod schemas (`z.infer`) and the generated API client instead of hand-written duplicates. `type` by default (`interface` only for a contract meant to be extended), no `I`/`E` prefixes; props types are `<Component>Props`. Files and folders in kebab-case; components PascalCase; hooks `useX`; Zod schemas `xSchema`; booleans `is/has/can`; event handlers `handleX`, callback props `onX`.
- **Next.js App Router best practices:** Server Components by default, `"use client"` only on the interactive leaves; server-side data loading, not `useEffect` fetching; `loading.tsx`, `error.tsx` and `not-found.tsx` per route segment where needed; `generateMetadata`/`metadata` for titles; `next/link`, `next/image`, `next/font`; `server-only` for server modules.
- **Maintainable, testable, accessible:** small components with explicit props; logic testable without rendering (ADR-001); semantic HTML, labelled controls, keyboard support and visible focus, WCAG 2.2 AA; every UI string externalized for `en` and `uk`.

## Styling

Every reused style has one home (details: [`web-patterns.md` §9](docs/web-patterns.md#9-styles)); a utility set that appears a second time moves there:

- Values (colors, radii, fonts) — tokens in `src/styles/theme.css` (shadcn/ui names) via Tailwind utilities; no raw hex values in components. Text sizes use the Tailwind scale.
- Small combinable utilities (`focus-ring`, ...) — `@utility` in `src/styles/utilities.css`.
- Non-interactive markup patterns (`.card`, `.page-title`, `.badge-*`) — `src/styles/components.css`.
- Interactive elements with variants — React components in `src/components/ui` (variants via `cva`).
- One-off styles — Tailwind classes in the component's JSX.
- No `style={{}}`, CSS Modules, `!important` or copied class strings. Conditional classes go through `cn()` (`src/lib/utils/cn.ts`, `clsx` + `tailwind-merge`) once it exists.

<!-- BEGIN:nextjs-agent-rules -->

## This is NOT the Next.js you know

This version has breaking changes — APIs, conventions, and file structure may all differ from your training data. Read the relevant guide in `node_modules/next/dist/docs/` (resolved from this file's directory; in monorepos the `next` package may not be visible from the repo root) before writing any code. Heed deprecation notices.

This block is written and re-added by `next dev` — verify at `node_modules/next/dist/server/lib/generate-agent-files.js`. Removing it from a diff only re-creates the uncommitted change; committing it with your work keeps the tree clean.

<!-- END:nextjs-agent-rules -->
