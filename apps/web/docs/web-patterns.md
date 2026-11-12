# Web patterns — `apps/web`

How recurring problems are solved in `apps/web`. Read together with [`AGENTS.md`](../AGENTS.md);
root [`AGENTS.md`](../../../AGENTS.md) wins on conflict. Implementation and review of `web` stories
check code against this document; §8 is the file layout and §9 the style layout every web story follows. Next.js API details: `node_modules/next/dist/docs/01-app/`.

## 1. React Compiler

`reactCompiler: true` is enabled in `next.config.ts` (`babel-plugin-react-compiler`) —
[ADR-003](../../../docs/adr/ADR-003-react-compiler.md).

- Do not add `useMemo`, `useCallback` or `React.memo` for render performance; the compiler
  memoizes automatically.
- Follow the Rules of React: pure render, no mutation of props/state, hooks only at the top level.
  Code that breaks them is skipped by the compiler silently.
- `"use no memo"` only as a temporary opt-out for a proven compiler issue, with a comment linking
  the issue.

## 2. `proxy.ts` — optimistic redirects only

`src/proxy.ts` (Next 16 replacement for `middleware.ts`) centralizes redirects:

- no locale prefix → redirect to the same path under `/<cookie locale or en>` (D-01-10); this
  runs first, and the redirects below work on the locale-stripped path and keep the prefix;
- no session cookie on a `(protected)` route → redirect to login;
- session cookie on a login/registration route → redirect into the app.

Rules:

- Proxy checks only that the opaque session cookie **exists**. No database, no NestJS call, no
  token handling — it runs on every matched request.
- Proxy is not a security boundary. The server-only session lookup in `lib/auth` runs wherever
  protected data is loaded, and NestJS authorizes every resource.
- Do not put auth checks in `layout.tsx`: layouts do not re-render on navigation and do not stop
  child segments from rendering.
- Limit the `matcher` to page routes; exclude `api`, `_next/*` and static files.

Docs: `01-getting-started/16-proxy.md`, `02-guides/authentication.md` ("Optimistic checks with
Proxy", "Layouts and auth checks").

## 3. Dialogs with their own URL — intercepting + parallel routes

Use when a dialog should be linkable and close on browser Back (e.g. "Add Contribution", a Goal
opened from a list). Dialogs that are only a confirmation (archive, delete) stay local state.

```text
app/[locale]/(protected)/goals/
├── layout.tsx              # renders {children} and {modal}
├── page.tsx                # goals list
├── [goalId]/page.tsx       # full page: direct link, refresh
└── @modal/
    ├── default.tsx         # returns null — required, otherwise refresh renders 404
    └── (.)[goalId]/page.tsx  # same content inside a Dialog on client navigation
```

- Both pages render the same feature component; only the wrapper differs.
- Close with `router.back()`; the Dialog primitive from `components/ui` provides focus trap,
  `Esc` and focus return (WCAG 2.2 AA).

Docs: `03-api-reference/03-file-conventions/intercepting-routes.md`, `parallel-routes.md`,
`default.md`.

## 4. Filters and list state in the URL

Filters, sorting, selected week and pagination live in URL search params, so a view is shareable
and survives refresh.

```ts
// features/contributions/schemas/contribution-filters-schema.ts
export const contributionFiltersSchema = z.object({
  week: isoWeekSchema.optional().catch(undefined),
  projectId: z.uuid().optional().catch(undefined),
});
export type ContributionFilters = z.infer<typeof contributionFiltersSchema>;

// features/contributions/hooks/use-contribution-filters.ts
const searchParams = useSearchParams();
const filters = contributionFiltersSchema.parse(Object.fromEntries(searchParams));

// features/contributions/hooks/use-contributions.ts
useQuery({ queryKey: ['contributions', filters], queryFn: () => fetchContributions(filters) });
```

- Params are always parsed with a Zod schema; an invalid value drops only that filter (`.catch`), never `as`.
- The parsed object goes straight into the TanStack Query key. Do not copy filters into Context,
  Zustand or `useState`, and do not sync them with `useEffect` — the URL is the only source.
- Update the URL with `router.replace` (or `push` when Back should step through filters) inside
  `startTransition` (§6).
- Server Components read the same schema from the page's `searchParams` prop.

## 5. `use(Context)` and Providers

- Read context with `use(SomeContext)`; it also works after an early return.
- A Provider is allowed only for cross-cutting client state (TanStack `QueryClient`, i18n, session
  view). Server data is not put in Context — it belongs to TanStack Query.
- Export a small hook per context (`useSessionView`) that throws when the Provider is missing.
- Sensitive values (tokens, session id) never reach a Provider: Server Components pass only
  display data (name, locale) as props.

## 6. Suspense, streaming and transitions

- Each route segment gets `loading.tsx` where data loading is visible; inside a page wrap
  independent slow parts in their own `<Suspense>` so the shell streams first.
- Session-dependent shell parts (profile menu) are a nested Server Component in `<Suspense>`;
  do not `await` the session at the top of a layout.
- Components that call `useSearchParams` sit inside `<Suspense>`.
- Filter changes run in `useTransition`: the current list stays visible while the next one loads,
  `isPending` dims it. Server mutations use TanStack `useMutation`, not hand-written transitions.
- Errors: `error.tsx` per segment where a failure must not break the whole page; `not-found.tsx`
  for missing resources.

## 7. Error format: BFF → browser

NestJS errors are mapped in **one place** (`lib/api`) into the BFF contract; the browser never sees
the NestJS error body, stack traces or internal messages.

```ts
// Response body of a failed BFF Route Handler; HTTP status keeps its meaning (400, 401, 403, 404, 409, 422, 500)
type BffError = {
  code: string; // stable machine code, e.g. 'validation_failed', 'goal_not_found'
  fieldErrors?: Record<string, string[]>; // field → error codes, field names as in the form schema
};

// Server-side adapters in lib/api return a result instead of throwing for expected failures
type Result<T> = { ok: true; data: T } | { ok: false; status: number; error: BffError };
```

- A successful response returns the data directly with a 2xx status.
- `code` and field error codes are i18n keys on the client (`errors.<code>`); the BFF never sends
  translated text, so `en`/`uk` stay in the UI.
- Forms: `useMutation` `onError` → `setError(field, { message: t(code) })` for each field error,
  a form-level alert for `code` without fields.
- `401` → session ended: clear client state and redirect to login. Unknown errors → generic
  `errors.unexpected`, details only in server logs (without tokens or personal data).
- The NestJS error body itself is defined by `apps/api`; when it changes, only the mapper in
  `lib/api` and its tests change.

## 8. File roles

Each file has one role. UI files render; logic, helpers and types live next to them in files
named by role. Subfolders are created only when they have a file.

```text
features/<feature>/
├── index.ts            # public API: the only import path for app/, proxy.ts and other features
├── types.ts            # the feature's types and interfaces
├── constants.ts        # the feature's constants
├── components/         # UI only (+ <Component>Props next to the component)
├── hooks/              # use-<name>.ts: client state, effects, handlers with side effects
├── utils/              # pure functions; server helpers such as resolveLocale(params)
├── actions/            # Server Functions ('use server')
└── schemas/            # Zod schemas (§4)
```

| File                     | Contains                                                                                       | Does not contain                                     |
| ------------------------ | ---------------------------------------------------------------------------------------------- | ---------------------------------------------------- |
| `page.tsx`, `layout.tsx` | `await params`, one feature helper call, feature components, static markup with message texts   | branching, data mapping, `if (…) notFound()` inline  |
| component (`.tsx`)       | markup, one hook call (plus context hooks), `<Component>Props`, trivial inline handlers, `map` | `useState`/`useEffect`, async handlers, navigation   |
| hook (`use-*.ts`)        | state, effects, router, Server Function / query / mutation calls; returns a small typed API    | JSX                                                  |
| util (`utils/*.ts`)      | pure functions, tested without rendering (ADR-001)                                             | React hooks                                          |
| `types.ts`               | types and interfaces of the feature                                                            | runtime code                                         |

- Shared code: a hook, type or util used by ≥2 features moves to `src/hooks/`, `src/types/` or
  `src/lib/utils/` — not before.
- Naming: `type` by default, `interface` only for a contract meant to be extended; no `I`/`E`
  prefixes; props types are `<Component>Props`.
- `index.ts` exports only what other modules use; files inside the feature import each other
  directly, never through `index.ts`. No `index.ts` inside subfolders.
- Tests sit next to the file they test (`utils/locale.spec.ts`, `components/locale-toggle.spec.tsx`).

Example — `features/i18n`:

```tsx
// components/locale-toggle.tsx — UI only
export function LocaleToggle() {
  const { label, options, handleSelect } = useLocaleToggle();
  return (
    <div role="group" aria-label={label}>
      {options.map((option) => (
        <button key={option.locale} aria-pressed={option.isActive} onClick={() => handleSelect(option.locale)}>
          {option.label}
        </button>
      ))}
    </div>
  );
}

// app/[locale]/page.tsx — composition only
export default async function Home({ params }: PageProps<'/[locale]'>) {
  const locale = await resolveLocale(params); // calls notFound() for an unknown locale
  const { home } = getMessages(locale);
  return <h2>{home.workspaceSetup}</h2>;
}
```

## 9. Styles

Every reused style has exactly one home. A utility set that appears a **second** time moves to
the home below; it is never copied.

| What repeats                                    | Home                                                | Example                               |
| ----------------------------------------------- | --------------------------------------------------- | ------------------------------------- |
| A value: color, radius, font                    | `src/styles/theme.css` (token + `@theme inline`)    | `--primary`, `--radius`               |
| A small utility that combines with variants     | `src/styles/utilities.css` (`@utility`)             | `focus-ring`                          |
| A non-interactive markup pattern                | `src/styles/components.css` (`@layer components`)   | `.card`, `.page-title`, `.badge-info` |
| An interactive element, possibly with variants  | `src/components/ui/<name>.tsx` (variants via `cva`) | `Button variant="ghost"`              |
| A style used in one component only              | Tailwind classes in that component's JSX            | `flex items-center gap-1`             |

- Text sizes and spacing use the Tailwind scale; no custom typography tokens.
- Conditional classes: `cn()` from `src/lib/utils/cn.ts` (`clsx` + `tailwind-merge`). It and
  `class-variance-authority` are added by the first story that creates a `components/ui`
  component; until then a template string is allowed.
- Not used: `style={{}}`, CSS Modules, `!important`, raw hex values, `@apply` inside component
  files.
- `globals.css` only imports `tailwindcss`, `theme.css`, `utilities.css`, `components.css` and
  holds `@layer base`.

```css
/* styles/utilities.css */
@utility focus-ring {
  @apply focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2;
}
```

```tsx
<button className={cn('focus-ring rounded-sm px-2 py-1', isActive && 'font-semibold underline')} />
```

