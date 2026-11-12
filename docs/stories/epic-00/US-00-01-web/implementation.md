---
artifact_type: implementation_report
story: US-00-01-web
layer: web
version: 1
status: APPROVED
updated_at: 2026-11-12T10:06:11Z
produced_by: next-implementor
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/plan.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-web/tests.md, version: 1 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: apps/web/AGENTS.md }
  - { path: apps/web/docs/web-patterns.md }
---

# US-00-01-web — Implementation

## Changes

Paths are relative to `apps/web/`. Plan rows are in brackets.

| File | Change | AC |
| ---- | ------ | -- |
| `src/features/i18n/messages/en.json`, `uk.json` | Every key in the spec Strings table plus `notFound.title` / `notFound.backHome` (plan D3) [#1, #2] | AC-1, AC-2, AC-4, AC-5 |
| `src/features/i18n/locale.ts` | `locales`, `Locale`, `defaultLocale`, `LOCALE_COOKIE`, `isLocale`, `localeFromCookie`, `swapLocale` [#3] | AC-1, AC-2, AC-3, AC-7 |
| `src/features/i18n/messages.ts` | `Messages`, `DeepPartial`, `resolveMessages` (deep merge; a missing or empty `uk` text keeps `en`), `getMessages` (`uk` resolved once at module load), `messageKeys` [#4] | AC-4, AC-5 |
| `src/features/i18n/set-locale-cookie.ts` | `'use server'`; `isLocale` guard, then `cookies().set('locale', …, { path: '/', sameSite: 'lax', secure: NODE_ENV === 'production', maxAge: 1 year })` [#5] | AC-2, AC-3 |
| `src/features/i18n/i18n-provider.tsx` | `'use client'`; `I18nContext` + `I18nProvider({ locale, messages, children })` [#6] | AC-2 |
| `src/features/i18n/use-i18n.ts` | `useI18n()` reads the context with `use()`; throws outside the Provider (web-patterns §5) [#7] | AC-2, AC-6 |
| `src/features/i18n/locale-toggle.tsx` | `role="group"` + `aria-label`; two native buttons with `lang`, `aria-pressed`, active `font-semibold underline`, `focus-visible:ring-ring`. `handleSelect` awaits `setLocaleCookie`, ignores a failure, then `router.push(swapLocale(pathname, next) + window.location.search)`. No `useSearchParams` [#8] | AC-2, AC-6 |
| `src/app/layout.tsx` → `src/app/[locale]/layout.tsx` | `isLocale` guard → `notFound()`; `<html lang={locale}>`; `I18nProvider` with `getMessages(locale)`; `generateStaticParams` (en, uk); `generateMetadata` from `common.*` [#9] | AC-1, AC-2, AC-7 |
| `src/app/page.tsx` → `src/app/[locale]/page.tsx` | Same markup; text from `getMessages(locale)` [#10] | AC-1, AC-2 |
| `src/app/(public|auth|protected)/.gitkeep` → `src/app/[locale]/…` | Route groups moved under the locale [#11] | AC-7 |
| `src/app/global-not-found.tsx` | Full document, `lang="en"`, fonts + `globals.css`, `notFound.*` texts, link to `/en` [#12] | AC-7 |
| `src/proxy.ts` | First segment a locale → `next()`; otherwise 307 to `/<cookie locale or en><path><query>`. Matcher `'/((?!api|_next|.*\\..*).*)'`. Comment states the order for US-00-02-web [#13] | AC-1, AC-3, AC-7 |
| `next.config.ts` | `experimental.globalNotFound: true` [#14] | AC-7 |

All TEST_FIRST stubs are replaced; `grep -rn "not implemented\|TEST_FIRST stub" src` finds nothing.

## Deviations from the plan

- **The page also guards the locale.** `[locale]/page.tsx` calls `isLocale` and then `notFound()`.
  It needs the narrowed `Locale` type for `getMessages`, which avoids an `as` cast. The layout
  guard is unchanged.
- **The proxy test uses `unstable_doesMiddlewareMatch`.** That is the helper name
  16.4.5 exports. See `tests.md`.
- **Plan Risk 1 occurred.** For a path that matches `[locale]` with an invalid value, the root
  layout calls `notFound()`. Next 16.4.5 then serves its built-in 404 ("This page could not be
  found"), not `global-not-found.tsx`. Example: `/foo.txt` is excluded from the proxy, so
  `locale = "foo.txt"`. The status is **404**, so AC-7 holds. `global-not-found.tsx` does render
  for unmatched URLs under a valid locale, e.g. `/en/missing` → 404 with "Page not found —
  Archipelago". As the plan says, the fallback is accepted, and no workaround was added.

## Green run

Run in `apps/web`:

| Command | Exit | Result |
| ------- | ---- | ------ |
| `pnpm test` (vitest run) | 0 | 8 files, **76 passed** (69 story tests + 7 existing) |
| `pnpm lint` | 0 | no findings |
| `pnpm typecheck` (`next typegen && tsc --noEmit`) | 0 | — |
| `pnpm build` | 0 | `globalNotFound` experiment on; `/en` and `/uk` prerendered (○), `/[locale]` partial prerender, Proxy present |

Test file hashes match `tests.md` (all 7 unchanged).

Manual checks against `next start -p 3457` (plan "Checks"):

| Request | Result |
| ------- | ------ |
| `GET /` | 307 → `/en` |
| `GET /login?x=1`, `Cookie: locale=uk` | 307 → `/uk/login?x=1` |
| `GET /login`, `Cookie: locale=fr` | 307 → `/en/login` |
| `GET /fr` | 307 → `/en/fr` (then 404 via `global-not-found`) |
| `GET /en` / `GET /uk` | `<html lang="en">` "Workspace setup" / `<html lang="uk">` "Налаштування робочого простору" |
| `GET /en/missing` | 404, `global-not-found` (`lang="en"`, "Page not found") |
| `GET /foo.txt` | 404, Next default page (see Deviations) |
| `GET /api/x` | 404, no redirect |
| `grep -rn "document.cookie" src` | no match |

**Not run:** the in-browser toggle check from the plan. It covers `<html lang>` after the
client-side switch, the `locale` cookie in devtools, and `/` landing on `/uk`. No browser was
driven in this stage. The plan leaves it to REVIEW.

## Notes for review

- `resolveMessages` casts the merged tree to `Messages` with `as`. `merge` walks only the keys
  of `base` and keeps its shape, so the cast cannot add or drop keys. AC-4 tests cover this.
- Inactive toggle buttons also get `text-muted-foreground`. That is an extra cue: the
  `aria-pressed`, bold and underline cues required by NFR-005 do not depend on color.
- Moves and deletions were done with `git mv` / `git rm`, so they are **staged** in the index.
  Nothing is committed.
- No new dependency. `api-client`, NestJS and the `bff` schema are untouched.
