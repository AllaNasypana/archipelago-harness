---
artifact_type: specification
story: US-00-01-web
layer: web
version: 2
status: APPROVED
updated_at: 2026-11-12T09:51:36Z
produced_by: spec-writer
risk: high
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/clarification.md, version: 1 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: docs/design/README.md }
---

# US-00-01-web — Localization setup

## Summary

`apps/web` gets its i18n foundation: every UI route lives under a locale segment (`/en`, `/uk`),
UI text comes from `en`/`uk` message files with an `en` fallback, a `locale` cookie remembers the
browser's choice for unprefixed URLs, and a reusable EN | УКР toggle component switches the
locale. Placing the toggle on layouts is US-00-03-web and US-00-04-web (C2).

**Risk raised to `high`** (`stage-map.yaml` `story_rules.risk.high_when`: "touches … cookies"):
the story adds the `locale` cookie and creates `src/proxy.ts`, which the session story
(US-00-02-web) extends with session redirects. The cookie holds no secret; the raise is because
the rule names cookies without exception, so `HUMAN_PLAN_APPROVAL` now applies.

## Acceptance criteria

- **AC-1** Given a request to a UI URL without a locale prefix (e.g. `/`, `/login?returnTo=x`)
  and no `locale` cookie, when it is served, then the response redirects to the same path and
  query under `/en` (`/en`, `/en/login?returnTo=x`), and the page renders English text with
  `<html lang="en">`. _(UI-AC-05, D-01-10, C1, C3)_
- **AC-2** Given a page under `/en/<path>?<query>`, when I activate **УКР** in the toggle, then the
  browser navigates client-side to `/uk/<path>?<query>`, externalized strings render in Ukrainian,
  `<html lang>` is `uk`, and the `locale` cookie is `uk`. _(UI-AC-05, A4, D-01-10, C3, C5, C6)_
- **AC-3** Given the `locale` cookie is `uk`, when a UI URL without a prefix is requested, then it
  redirects to the same path and query under `/uk`. Given the cookie holds any other value, then
  it redirects under `/en`. _(UI-AC-05, C3)_
- **AC-4** Given a message key present in `en` and missing at runtime in `uk`, when it renders
  under `/uk`, then the `en` text is shown (no key name, no empty text). _(UI-AC-05)_
- **AC-5** Given the `en` and `uk` message files, when the test suite runs, then it fails if any
  key exists in only one of them. _(UI-AC-05, C4)_
- **AC-6** Given the toggle, then it is a labelled group of two buttons **EN** and **УКР**, both
  reachable and operable by keyboard (Tab, Enter/Space), and the active one has
  `aria-pressed="true"` and bold, underlined text (the inactive one `aria-pressed="false"`,
  regular weight, no underline) — never color alone. _(NFR-005, A4, C5)_
- **AC-7** Given a request to `/api/*`, `/_next/*` or a static file (a path with a file
  extension, e.g. `/favicon.ico`), then the proxy neither redirects nor prefixes it; and given
  the `[locale]` layout receives a segment value other than `en` | `uk`, then it calls
  `notFound()` (tested at the layout guard; the proxy prefixes every other path, so such a value
  reaches the app only through matcher-excluded paths). _(D-01-10)_

AC-1…AC-3 refine story AC-1/AC-2; AC-4/AC-5 refine story AC-3; AC-6 is story AC-4; AC-7 is the
edge behavior of D-01-10 (the BFF is not localized).

## Out of scope

- Per-account language and the Settings language field (EPIC-09, FR-009, D5).
- Placing the toggle on the auth layout and the app header (US-00-03-web, US-00-04-web; C2).
- `Accept-Language` detection (C1); locale-aware date/number formatting (C7, AGENTS.md §5).
- Preserving typed form values across a switch (C6).
- Translating user-authored content (BRD: never auto-translated).
- Session redirects in `proxy.ts` (US-00-02-web); this story only creates the file with the locale
  redirect.

## Design — web

### Route

| Item              | Decision                                                                                                                                                                                                                                                        |
| ----------------- | --------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locale segment    | `src/app/[locale]/` holds the root layout and every UI route group: `(public)`, `(auth)`, `(protected)` move under it. Allowed values `en` \| `uk`; `generateStaticParams` returns both.                                                                        |
| Root layout       | `src/app/[locale]/layout.tsx` replaces `src/app/layout.tsx`: `<html lang={locale}>`, fonts and `globals.css` as today; validates the segment and calls `notFound()` for any other value (AC-7); provides messages to Client Components (see Components).       |
| Home page         | `src/app/page.tsx` moves to `src/app/[locale]/page.tsx`; its text ("Archipelago", tagline, "Workspace setup", "In progress") and `metadata` title/description come from message files (`generateMetadata`). No other change to the page.                         |
| BFF               | `src/app/api/` stays outside `[locale]`; it has no layout and is not localized (D-01-10).                                                                                                                                                                         |
| Proxy             | New `src/proxy.ts` (web-patterns §2). If the first path segment is `en` or `uk`, pass through. Otherwise redirect (307) to `/<cookie locale or en><path><query>`. `matcher` excludes `api`, `_next/*` and files with an extension (favicon, public assets). Ordering for US-00-02-web: the locale redirect runs first; session redirects then work on the locale-stripped path and keep the prefix (D-01-10). |
| Not found         | An invalid `[locale]` makes the layout call `notFound()` (AC-7). How the not-found page renders without a root layout above `[locale]` (e.g. `global-not-found.js` behind the experimental `globalNotFound` flag in `next.config.ts`) is recorded as a PLANNING decision. |

### Locale and cookie

| Item        | Decision                                                                                                                                                                                 |
| ----------- | ---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Locale type | `Locale = 'en' \| 'uk'`, default `en`, one `isLocale(value)` guard used by proxy, layout and toggle.                                                                                     |
| Cookie      | Name `locale`; value `en` \| `uk`; `Path=/`, `SameSite=Lax`, `Secure` in production, `Max-Age` one year. Not a secret, so readable by the client. Any other value is ignored (AC-3).   |
| Written by  | The toggle only, when the user picks a locale (C3), through the Server Function `setLocaleCookie(locale)` (`'use server'`, in `src/features/i18n/`) — a permitted server response context (`apps/web/AGENTS.md`: cookie mutations only there). The function treats its argument as untrusted: `isLocale` guard, any other value sets nothing and returns. It calls `(await cookies()).set` with the attributes above. No client-side `document.cookie` write. The proxy only reads the cookie. |
| `Secure`    | `secure: process.env.NODE_ENV === 'production'` — production is served only over HTTPS behind Caddy (AGENTS.md §2); `next dev` on `http://localhost` needs it off.                         |
| Ordering    | The toggle `await`s `setLocaleCookie` before `router.push`, so an unprefixed request right after the switch already sees the new cookie (AC-3). If the call fails, the toggle still navigates (the prefix is the source of truth for the page; only the remembered choice is lost). |
| CSRF        | Server Functions are POST-only and Next checks `Origin` against `Host`; the cookie is a non-secret preference, so a forged call can at most change the remembered language. No extra token. |

The one-year lifetime is a design choice, not a product rule; the reviewer or human may change it.

### Messages

| Item         | Decision                                                                                                                                                                                                    |
| ------------ | ----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| Files        | One message file per locale (`en`, `uk`), same nested key structure, namespaced by feature (`common`, `localeToggle`, `home`). Location and format follow the i18n library chosen in PLANNING (story note). |
| Fallback     | `uk` messages are resolved over `en`: a key missing in `uk` returns the `en` text (AC-4). No key name or empty text is ever rendered.                                                                        |
| Parity test  | A unit test compares the flattened key sets of `en` and `uk` and fails naming each key present in only one (AC-5).                                                                                         |
| Access       | Server Components read messages on the server; Client Components get them through one i18n Provider in the root layout (web-patterns §5 allows an i18n Provider). Messages are display text only.            |

### Components

```text
src/app/[locale]/layout.tsx          Server: lang, fonts, i18n Provider
src/app/[locale]/page.tsx            Server: home placeholder, strings from messages
src/features/i18n/                   (feature folder for locale handling)
  locale-toggle.tsx                  Client: EN | УКР group (AC-2, AC-6)
  locale.ts                          Locale type, default, isLocale, swapLocale(pathname, locale)
  set-locale-cookie.ts               Server Function: validates and sets the `locale` cookie (AC-2, AC-3)
src/proxy.ts                         locale redirect (AC-1, AC-3, AC-7)
```

- `LocaleToggle` props: none; it reads the current locale (i18n Provider) and the pathname
  (`usePathname`). It does **not** call `useSearchParams`: the query string is read from
  `window.location.search` at click time, so the toggle needs no `<Suspense>` boundary on static
  pages (web-patterns §6) and the placing stories inherit no such requirement. On activating the
  inactive button it `await`s `setLocaleCookie` and then navigates with `router.push` to the same
  path and query under the other prefix (`swapLocale`). Activating the active button does
  nothing.
- `swapLocale(pathname, locale)` is a pure function (unit-tested): replaces the first segment,
  keeps the rest.
- No `components/ui` primitive exists yet; the toggle uses native `<button>` elements. Exact file
  names inside the feature folder are a PLANNING detail.

### UI states

No loading, empty, error or disabled states: the toggle is synchronous and the messages load with
the page. During the client-side navigation the current page stays visible until the next one
renders.

### Design

- Mockups: header toggle in `general/alignment-dashboard.png`, auth-page toggle in
  `epic-01-auth/google-sign-in-screens.png`; corrections applied: labels **EN / УКР**, not "EN /
  UK" (design README, BRD A4).
- Tokens only from `src/styles/theme.css`; no new tokens or shared classes. Active cue: `font-semibold`
  plus underline; focus ring visible (NFR-005).

### Strings

| Key                     | `en`                                               | `uk`                                                    |
| ----------------------- | -------------------------------------------------- | ------------------------------------------------------- |
| `common.appName`        | Archipelago                                        | Archipelago                                             |
| `common.appDescription` | Align invested time with your chosen priorities.   | Узгоджуйте вкладений час зі своїми пріоритетами.        |
| `home.tagline`          | Choose Focus → Invest Time → Reflect → Adjust      | Обери фокус → Інвестуй час → Рефлексуй → Коригуй        |
| `home.workspaceSetup`   | Workspace setup                                    | Налаштування робочого простору                          |
| `home.inProgress`       | In progress                                        | У процесі                                               |
| `localeToggle.label`    | Language                                           | Мова                                                    |
| `localeToggle.en`       | EN                                                 | EN                                                      |
| `localeToggle.uk`       | УКР                                                | УКР                                                     |

The product name stays "Archipelago" in both locales (BRD). The `uk` texts are proposals for the
human to correct at `HUMAN_SPEC_APPROVAL`.

### BFF and data

None: no route handler, no api client call, no session effect. The proxy reads only the `locale`
cookie.

### Accessibility

- Toggle: `role="group"` with `aria-label` from `localeToggle.label`; two native `<button
  type="button">` with `aria-pressed`; visible text is the accessible name (WCAG 2.5.3); the УКР
  button has `lang="uk"`.
- Keyboard: Tab reaches each button, Enter/Space activates; visible focus.
- Active state: `aria-pressed`, bold and underline — not color alone (NFR-005).
- `<html lang>` matches the locale (WCAG 3.1.1).
- 360 px: the toggle is two short labels and fits; no horizontal scroll (NFR-006).

## Open points

- AC-2 test asserts `<html lang>` **after** the client-side navigation, not only on first render.
  If Next 16 performs a full page load across the `[locale]` change instead, that is acceptable
  (C6 already accepts losing form state) and is recorded in tests/implementation.
- Tests for `setLocaleCookie`: a valid locale sets the cookie with the stated attributes; an
  invalid value sets nothing.
- i18n library (or a hand-written dictionary per the Next 16 guide) is chosen in PLANNING (story
  note); the design above holds for either.
- The not-found rendering for an invalid `[locale]` with no layout above it is a PLANNING decision, including any `next.config.ts` flag (Route table).
- Moving the route groups under `[locale]` touches only `.gitkeep` placeholders today.
- Cookie `Max-Age` (one year) and the `uk` strings are proposals for the human to confirm at
  `HUMAN_SPEC_APPROVAL` (review F5).
