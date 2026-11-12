---
artifact_type: implementation_plan
story: US-00-01-web
layer: web
version: 1
status: APPROVED
updated_at: 2026-11-12T09:57:16Z
produced_by: implementation-planner
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/spec.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: apps/web/AGENTS.md }
  - { path: apps/web/docs/web-patterns.md }
  - { path: docs/adr/ADR-001-web-testing.md }
  - { path: docs/adr/ADR-003-react-compiler.md }
---

# US-00-01-web — Implementation plan

## Approach

Follow the Next 16 internationalization guide (`node_modules/next/dist/docs/01-app/02-guides/internationalization.md`)
with no new dependency. Every UI route moves under `src/app/[locale]/`. Each locale has a JSON
dictionary. `src/proxy.ts` adds the locale prefix, reading only the `locale` cookie. The root
layout checks the segment and passes the resolved messages to one small client i18n Provider.
The toggle is a Client Component. It awaits the `setLocaleCookie` Server Function and then
navigates with `router.push`. All logic that can be tested without rendering lives in pure
functions (`locale.ts`, `messages.ts`). The app has two locales and eight strings today, so an
i18n library would add a dependency without removing any complexity (AGENTS.md §5 "Add
dependencies only when there is a demonstrated need").

## Changes

Order: messages and pure functions → Server Function → Provider/hook → toggle → route and layout → proxy → config.

| # | File (create / modify) | What and why | AC |
| - | ---------------------- | ------------ | -- |
| 1 | create `apps/web/src/features/i18n/messages/en.json` | Every key in the spec Strings table, plus the `notFound.*` keys (Decisions D3). Nested by namespace: `common`, `home`, `localeToggle`, `notFound`. | AC-1, AC-4, AC-5 |
| 2 | create `apps/web/src/features/i18n/messages/uk.json` | Same keys, `uk` texts from the spec Strings table. | AC-2, AC-5 |
| 3 | create `apps/web/src/features/i18n/locale.ts` | `locales = ['en','uk'] as const`, `type Locale`, `defaultLocale = 'en'`, `isLocale(value: unknown): value is Locale`, `localeFromCookie(value: string \| undefined): Locale` (`uk` only for exactly `'uk'`, else `en`), `swapLocale(pathname, locale)`, which replaces the first segment and keeps the rest, `LOCALE_COOKIE = 'locale'`. Pure; imported by proxy, layout, toggle and Server Function. | AC-1, AC-2, AC-3, AC-7 |
| 4 | create `apps/web/src/features/i18n/messages.ts` | `type Messages = typeof en`; `resolveMessages(base: Messages, override: DeepPartial<Messages>): Messages`, a deep merge where a missing or empty `override` value keeps `base` (AC-4); `getMessages(locale)` returns `en` for `en` and `resolveMessages(en, uk)` for `uk`; `messageKeys(obj)` flattens keys to dotted paths for the parity test. JSON is imported statically; the dictionaries are a few hundred bytes. | AC-4, AC-5 |
| 5 | create `apps/web/src/features/i18n/set-locale-cookie.ts` | `'use server'`; `setLocaleCookie(locale: unknown): Promise<void>`. If `!isLocale(locale)` return without writing. Otherwise `(await cookies()).set(LOCALE_COOKIE, locale, { path: '/', sameSite: 'lax', secure: process.env.NODE_ENV === 'production', maxAge: 60 * 60 * 24 * 365 })`. Not `httpOnly`, per the spec ("readable by the client"; no client code reads it today). | AC-2, AC-3 |
| 6 | create `apps/web/src/features/i18n/i18n-provider.tsx` | `'use client'`; a Context holding `{ locale, messages }`; `I18nProvider({ locale, messages, children })`. This is the one i18n Provider web-patterns §5 allows. | AC-2 |
| 7 | create `apps/web/src/features/i18n/use-i18n.ts` | `useI18n()` returns `{ locale, messages }` and throws a clear error outside the Provider. | AC-2, AC-6 |
| 8 | create `apps/web/src/features/i18n/locale-toggle.tsx` | `'use client'`; `role="group"` with `aria-label={messages.localeToggle.label}`, and two `<button type="button">` with `aria-pressed`, `lang="en"`/`lang="uk"`. The active button gets `font-semibold underline`; all buttons get a visible focus ring from tokens. The inactive button's `handleSelect`: `await setLocaleCookie(next)` inside `try`; on `catch` still navigate; then `router.push(swapLocale(pathname, next) + window.location.search)`. `pathname` comes from `usePathname()`. No `useSearchParams` (spec, review F2). The active button does nothing. | AC-2, AC-6 |
| 9 | move `apps/web/src/app/layout.tsx` → `apps/web/src/app/[locale]/layout.tsx` | `RootLayout({ children, params }: LayoutProps<'/[locale]'>)`: `const { locale } = await params; if (!isLocale(locale)) notFound();`, `<html lang={locale}>` with the same fonts and classes, `<body>` wraps children in `<I18nProvider locale messages={getMessages(locale)}>`. `generateStaticParams` returns `[{ locale: 'en' }, { locale: 'uk' }]`. `generateMetadata` takes title and description from `common.*`. `globals.css` import path becomes `../globals.css`. No `dynamicParams` export: it fails the build under `cacheComponents` (`migrating-to-cache-components.md` §"dynamicParams is not supported"), so the `isLocale` guard is the check. | AC-1, AC-2, AC-7 |
| 10 | move `apps/web/src/app/page.tsx` → `apps/web/src/app/[locale]/page.tsx` | Same markup; text from `getMessages(locale).home.*` / `common.appName`. | AC-1, AC-2 |
| 11 | move `apps/web/src/app/(public)/.gitkeep`, `(auth)/.gitkeep`, `(protected)/.gitkeep` → under `apps/web/src/app/[locale]/` | Route groups live under the locale (spec Route). `src/app/api/` stays where it is. | AC-7 |
| 12 | create `apps/web/src/app/global-not-found.tsx` | The 404 page for paths that match no route and for an invalid `[locale]`. There is no layout above `[locale]` (Next 16 not-found docs, "global-not-found.js"). It imports `./globals.css` and the same fonts, renders `<html lang="en">`, and takes its text from `getMessages('en').notFound.*`. | AC-7 |
| 13 | create `apps/web/src/proxy.ts` | `proxy(request: NextRequest)`: if the first segment `isLocale`, return `NextResponse.next()`. Otherwise `request.nextUrl.clone()`, set pathname to `/${localeFromCookie(cookie)}${pathname === '/' ? '' : pathname}`, keep the search, `NextResponse.redirect(url, 307)`. `config.matcher: ['/((?!api|_next|.*\\..*).*)']` excludes `api`, `_next` and any path with a dot. A comment states the order for US-00-02-web: locale first, then session redirects that keep the prefix. | AC-1, AC-3, AC-7 |
| 14 | modify `apps/web/next.config.ts` | Add `experimental: { globalNotFound: true }` (needed by #12). Nothing else changes. | AC-7 |

## Impact

- `src/app/layout.tsx` and `src/app/page.tsx` move. The `/` URL now redirects to `/en`; nothing
  links to `/` yet.
- `src/app/api/` is untouched and stays outside the proxy matcher and `[locale]`. BFF route
  handlers are not localized (D-01-10).
- `src/app/globals.css`, `src/styles/*` and `favicon.ico` are unchanged; `favicon.ico` stays at
  the `app/` root, outside `[locale]`.
- `src/lib/utils/split-minutes*` is unaffected.
- `next.config.ts` gains one experimental flag. `reactCompiler`, `cacheComponents`,
  `partialPrefetching` and the Turbopack rules are unchanged.
- The following stories build on this one. US-00-02-web extends `proxy.ts`. US-00-03-web and
  US-00-04-web place `<LocaleToggle />`, which needs no props and no `<Suspense>`. Every later web
  page reads text through `getMessages` (server) or `useI18n` (client).

## Migration

None. There is no Prisma or `bff` schema change.

## Decisions

| # | Decision | Chosen | Why |
| - | -------- | ------ | --- |
| D1 | i18n library (story note: chosen in PLANNING) | No library. Hand-written JSON dictionaries plus `getMessages`, a client Context, and an `en` fallback via `resolveMessages`, following the Next 16 i18n guide. | It meets AC-1…AC-7 with about 100 lines. Two locales, no plurals or interpolation, and date/number formatting is out of scope (C7). It adds no dependency (AGENTS.md §5). If a later story needs ICU plurals, it can propose `next-intl` and keep the key structure. This is a project-wide pattern with no ADR. The story note gives the choice to PLANNING, and `HUMAN_PLAN_APPROVAL` is the approval point. If the human wants an ADR instead, reject to PLANNING. |
| D2 | How to 404 an invalid `[locale]` (spec Route "Not found", review F3) | Layout guard `isLocale` → `notFound()`, plus `app/global-not-found.tsx` with `experimental.globalNotFound: true`. | `dynamicParams = false` is not available with `cacheComponents: true`. The root layout sits under a dynamic segment, which is the case the Next docs give for `global-not-found.js`. |
| D3 | 404 text | Add keys `notFound.title` ("Page not found" / "Сторінку не знайдено") and `notFound.backHome` ("Go to home page" / "На головну"). The global 404 page renders in `en` with `lang="en"` because it has no locale. | Every UI string is externalized (AGENTS.md §1). The spec's Strings table did not list 404 text because the not-found page was left to PLANNING. **The human confirms these two keys and their `uk` text at `HUMAN_PLAN_APPROVAL`.** |
| D4 | Typing messages | `Messages = typeof en` (JSON import); `uk` is typed as `DeepPartial<Messages>`. | A missing `uk` key still compiles, so the fallback is reachable (AC-4). The parity test catches the gap (AC-5). There is one source of truth for the shape. |
| D5 | Proxy matcher | `'/((?!api\|_next\|.*\\..*).*)'` | Excludes `api`, `_next/*` and file paths (AC-7, web-patterns §2 "Limit the matcher to page routes"). |

## AC → test matrix

All tests use Vitest (ADR-001); `pnpm --filter @archipelago/web test`.

| AC | Test level | Test file | Cases (incl. boundaries) |
| -- | ---------- | --------- | ------------------------ |
| AC-1 | unit (node env) | `apps/web/src/proxy.spec.ts` | No cookie: `/` → 307 to `/en`; `/login?returnTo=x` → `/en/login?returnTo=x` (query kept); a nested path `/a/b` → `/en/a/b`. `/en` and `/en/login` → pass through (no redirect). |
| AC-1, AC-2 | component | `apps/web/src/app/[locale]/layout.spec.tsx` | `await RootLayout({ params: Promise.resolve({ locale }), children })` gives `<html lang="en">` for `en` and `lang="uk"` for `uk`, and the Provider receives the `uk` messages. `next/font/google` is mocked. |
| AC-1, AC-2 | component | `apps/web/src/app/[locale]/page.spec.tsx` | `en` renders "Workspace setup"; `uk` renders "Налаштування робочого простору". |
| AC-2 | component | `apps/web/src/features/i18n/locale-toggle.spec.tsx` | Under `/en/login` with `window.location.search = '?returnTo=x'`, clicking УКР calls `setLocaleCookie('uk')` **before** `router.push('/uk/login?returnTo=x')` (call order asserted). If `setLocaleCookie` rejects, it still pushes. Clicking the active button calls neither. `next/navigation` and `./set-locale-cookie` are mocked. |
| AC-2, AC-3 | unit (node env) | `apps/web/src/features/i18n/set-locale-cookie.spec.ts` | `'uk'` sets `locale=uk` with `path '/'`, `sameSite 'lax'`, `maxAge 31536000`. `secure` is false when `NODE_ENV` is `test`/`development` and true when it is `production` (`vi.stubEnv`). `'fr'`, `''`, `undefined`, `'UK'` and `' uk'` set nothing. `next/headers` is mocked. |
| AC-2 | unit | `apps/web/src/features/i18n/locale.spec.ts` | `swapLocale('/en', 'uk')` → `/uk`; `swapLocale('/en/login', 'uk')` → `/uk/login`; `swapLocale('/uk/a/b', 'en')` → `/en/a/b`. |
| AC-3 | unit (node env) | `apps/web/src/proxy.spec.ts` | Cookie `uk`: `/login?x=1` → `/uk/login?x=1`. Cookie `en`, `fr`, `UK` or empty → `/en/...`. |
| AC-3 | unit | `apps/web/src/features/i18n/locale.spec.ts` | `localeFromCookie`: `'uk'`→uk; `'en'`, `undefined`, `''`, `'UK'`, `'uk '`, `'ук'`→en. `isLocale` accepts only `'en'`/`'uk'`. |
| AC-4 | unit | `apps/web/src/features/i18n/messages.spec.ts` | `resolveMessages(en, partial)` uses `en` for a missing nested key, a missing namespace and an empty-string value, and the result has every `en` key. `getMessages('uk')` returns `uk` text where present. |
| AC-5 | unit | `apps/web/src/features/i18n/messages.spec.ts` | `messageKeys(en)` equals `messageKeys(uk)`. The failure message names keys present in only one file. A second case runs the helper on synthetic objects to prove it detects a one-sided key in both directions. |
| AC-6 | component | `apps/web/src/features/i18n/locale-toggle.spec.tsx` | `getByRole('group', { name: 'Language' })`; two buttons named **EN** and **УКР**. The active one has `aria-pressed="true"` and the classes `font-semibold` and `underline`; the inactive one has `aria-pressed="false"` and neither class. Tab focuses EN then УКР. Enter on УКР and Space on УКР each trigger navigation (user-event). The УКР button has `lang="uk"`. |
| AC-7 | unit (node env) | `apps/web/src/proxy.spec.ts` | `unstable_doesProxyMatch` (`next/experimental/testing/server`) with `config`: `/api/v1/x`, `/_next/static/a.js` and `/favicon.ico` are false; `/`, `/login` and `/en/login` are true. |
| AC-7 | component | `apps/web/src/app/[locale]/layout.spec.tsx` | `params.locale` of `'fr'`, `'EN'` and `'favicon.ico'` makes `RootLayout` throw via `notFound()` (`next/navigation` mocked to throw a sentinel). |

**Not covered by Vitest (manual check in REVIEW).** These need a running Next server and browser,
and ADR-001 has no browser e2e tool:

- `<html lang>` after the client-side navigation in AC-2 (review F4). Expected `uk`; a full page
  load is acceptable (C6).
- The `global-not-found` page rendering for `/foo.txt`.
- The `Set-Cookie` header on the toggle's request.

## Checks

Beyond the baseline (`pnpm --filter @archipelago/web lint`, `typecheck`, `test`):

- `pnpm --filter @archipelago/web build`. It must pass with `cacheComponents`, `generateStaticParams`
  and the experimental `globalNotFound` flag. Both `/en` and `/uk` must prerender.
- Manual check with `pnpm --filter @archipelago/web build && pnpm --filter @archipelago/web start`:
  - `curl -sI localhost:3000/` → `307` to `/en`.
  - `curl -sI -H 'Cookie: locale=uk' localhost:3000/login?x=1` → `/uk/login?x=1`.
  - `curl -sI localhost:3000/foo.txt` → `404`.
  - In a browser, toggle EN→УКР on `/en`, then confirm the URL, `<html lang>`, the `locale` cookie
    in devtools, and a visit to `/` landing on `/uk`.
- `grep -rn "document.cookie" apps/web/src` returns nothing (spec: no client cookie write).

## Risks

- The `globalNotFound` flag is experimental. If `notFound()` in the root layout does not render
  `global-not-found` in 16.4.5, the implementor records it in `implementation.md` and falls back
  to the default Next 404. The status stays 404, so AC-7 still holds.
- Under `cacheComponents`, awaiting `params` in the root layout for a value outside
  `generateStaticParams` is runtime data. The `isLocale` guard runs before any render, so it should
  not need a `<Suspense>`. If the build reports blocking runtime data, the implementor follows the
  error's documented fix and records it.
