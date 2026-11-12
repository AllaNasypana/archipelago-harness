---
artifact_type: test_report
story: US-00-01-web
layer: web
version: 1
status: APPROVED
updated_at: 2026-11-12T10:02:19Z
produced_by: test-writer
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/plan.md, version: 1 }
  - { path: apps/web/AGENTS.md }
  - { path: docs/adr/ADR-001-web-testing.md }
---

# US-00-01-web — Tests (red)

All tests use Vitest (ADR-001) in `apps/web`. Paths below are relative to `apps/web/`.

## Tests

| AC | Test file | Test name | Level |
| -- | --------- | --------- | ----- |
| AC-1 | `src/proxy.spec.ts` | redirects `/`, `/login?returnTo=x`, `/a/b` to the `/en` path with 307 | unit (node) |
| AC-1 | `src/proxy.spec.ts` | passes `/en`, `/en/login`, `/uk/login?x=1` through | unit (node) |
| AC-1, AC-2 | `src/app/[locale]/layout.spec.tsx` | renders `<html lang="en">` / `<html lang="uk">` | component |
| AC-2 | `src/app/[locale]/layout.spec.tsx` | gives the i18n Provider the uk locale and messages | component |
| AC-1 | `src/app/[locale]/page.spec.tsx` | renders English text under /en | component |
| AC-2 | `src/app/[locale]/page.spec.tsx` | renders Ukrainian text under /uk | component |
| AC-2 | `src/features/i18n/locale-toggle.spec.tsx` | saves the cookie before navigating to the same path and query under /uk (call order) | component |
| AC-2 | `src/features/i18n/locale-toggle.spec.tsx` | still navigates when saving the cookie fails | component |
| AC-2 | `src/features/i18n/locale-toggle.spec.tsx` | does nothing when the active locale is clicked | component |
| AC-2, AC-3 | `src/features/i18n/set-locale-cookie.spec.ts` | sets locale=uk for a year on the whole site, SameSite=Lax | unit (node) |
| AC-2 | `src/features/i18n/set-locale-cookie.spec.ts` | sets Secure from NODE_ENV (`test`, `development` → false; `production` → true) | unit (node) |
| AC-3 | `src/features/i18n/set-locale-cookie.spec.ts` | sets nothing for untrusted value (`fr`, `''`, `undefined`, `UK`, ` uk`, `null`, `{}`) | unit (node) |
| AC-2 | `src/features/i18n/locale.spec.ts` | swapLocale: `/en`→`/uk`, `/en/login`→`/uk/login`, `/uk/a/b`→`/en/a/b` | unit |
| AC-3 | `src/proxy.spec.ts` | redirects under /uk when the cookie is uk | unit (node) |
| AC-3 | `src/proxy.spec.ts` | redirects under /en for cookie `en`, `fr`, `UK`, empty | unit (node) |
| AC-3 | `src/features/i18n/locale.spec.ts` | localeFromCookie: `uk`→uk; `en`, undefined, `''`, `UK`, `uk `, `ук`, `fr`→en | unit |
| AC-3 | `src/features/i18n/locale.spec.ts` | isLocale accepts `en`/`uk`; rejects `EN`, `UK`, ` uk`, `fr`, `''`, undefined, null, 1 | unit |
| AC-4 | `src/features/i18n/messages.spec.ts` | resolveMessages: missing nested key, missing namespace, empty-string value fall back to en; empty override keeps every key | unit |
| AC-4 | `src/features/i18n/messages.spec.ts` | getMessages('uk') returns uk text where present and every en key | unit |
| AC-5 | `src/features/i18n/messages.spec.ts` | messageKeys flattens to dotted paths; detects a one-sided key in both directions (synthetic) | unit |
| AC-5 | `src/features/i18n/messages.spec.ts` | en and uk have the same keys (failure lists `onlyInEn` / `onlyInUk`; en must be non-empty) | unit |
| AC-6 | `src/features/i18n/locale-toggle.spec.tsx` | group labelled Language with EN and УКР buttons; УКР has `lang="uk"` | component |
| AC-6 | `src/features/i18n/locale-toggle.spec.tsx` | active: `aria-pressed="true"`, `font-semibold`, `underline`; inactive: `false`, neither class | component |
| AC-6 | `src/features/i18n/locale-toggle.spec.tsx` | reaches EN then УКР with Tab; Enter and Space on УКР switch | component |
| AC-7 | `src/proxy.spec.ts` | skips `/api/v1/x`, `/_next/static/a.js`, `/favicon.ico`; runs on `/`, `/login`, `/en/login` (one table assertion) | unit (node) |
| AC-7 | `src/app/[locale]/layout.spec.tsx` | calls notFound() for locale `fr`, `EN`, `favicon.ico` | component |

**Not covered by Vitest** (plan: manual check in REVIEW): `<html lang>` after the client-side
navigation of AC-2; the `global-not-found` page for `/foo.txt`; the `Set-Cookie` header on the
toggle request.

Notes for IMPLEMENTATION:

- Plan names `unstable_doesProxyMatch`; Next 16.4.5 exports only `unstable_doesMiddlewareMatch`
  from `next/experimental/testing/server` (same signature). The test uses the exported name. The
  planned matcher `'/((?!api|_next|.*\\..*).*)'` was checked against the AC-7 table outside the
  repo and matches it.
- Mocked boundaries only: `next/navigation`, `next/headers`, `next/font/google`, and
  `./set-locale-cookie` in the toggle test. The toggle test renders the real `I18nProvider` with
  the real `en.json`, so the toggle labels come from the dictionary.
- The layout test calls `RootLayout` and inspects the returned element tree (`<html>` and the
  `I18nProvider` element), because an `<html>` root cannot be mounted by Testing Library.
- AC-7's matcher cases are one table assertion. Split per path, the "excluded" half would pass
  against any stub matcher.

## Stubs

Files created only so tests compile (removed or filled by IMPLEMENTATION). Function bodies throw
`not implemented`.

| File | Stub |
| ---- | ---- |
| `src/features/i18n/locale.ts` | Real `locales`, `Locale`, `defaultLocale`, `LOCALE_COOKIE`; `isLocale`, `localeFromCookie`, `swapLocale` throw |
| `src/features/i18n/messages.ts` | Types `Messages`, `DeepPartial`; `resolveMessages`, `getMessages`, `messageKeys` throw |
| `src/features/i18n/messages/en.json`, `uk.json` | `{}`; IMPLEMENTATION fills them (plan #1, #2) |
| `src/features/i18n/set-locale-cookie.ts` | `'use server'`; `setLocaleCookie` throws |
| `src/features/i18n/i18n-provider.tsx` | `'use client'`; `I18nProvider` throws |
| `src/features/i18n/locale-toggle.tsx` | `'use client'`; `LocaleToggle` throws |
| `src/app/[locale]/layout.tsx` | `RootLayout` throws; replaced by the moved `src/app/layout.tsx` (plan #9) |
| `src/app/[locale]/page.tsx` | `Home` throws; replaced by the moved `src/app/page.tsx` (plan #10) |
| `src/proxy.ts` | `proxy` throws; `config.matcher: ['/__not-implemented__']` |

The old `src/app/layout.tsx` and `src/app/page.tsx` are untouched. `pnpm build` is not expected
to pass until IMPLEMENTATION moves them.

## Red run

`pnpm --filter @archipelago/web test` (vitest run) → **exit 1**. 8 files: 7 failed, 1 passed.
76 tests: **69 failed, 7 passed**. The 7 passing tests are the existing `split-minutes.spec.ts`.

Every new test fails on missing behavior. No test fails on an import, syntax or setup error:

| File | Failing | Reason |
| ---- | ------- | ------ |
| `proxy.spec.ts` | 12/12 | `not implemented: proxy(...)`; matcher table differs (stub matcher) |
| `app/[locale]/layout.spec.tsx` | 6/6 | `not implemented: RootLayout`; the notFound cases expected `NEXT_NOT_FOUND` but got `not implemented` |
| `app/[locale]/page.spec.tsx` | 2/2 | `not implemented: Home` |
| `features/i18n/locale-toggle.spec.tsx` | 8/8 | `not implemented: I18nProvider` (the toggle stub would throw next) |
| `features/i18n/locale.spec.ts` | 21/21 | `not implemented: swapLocale / localeFromCookie / isLocale` |
| `features/i18n/messages.spec.ts` | 9/9 | `not implemented: resolveMessages / getMessages / messageKeys` |
| `features/i18n/set-locale-cookie.spec.ts` | 11/11 | `not implemented: setLocaleCookie(...)` (untrusted-value cases: promise rejected instead of resolving) |

Other checks on the tests and stubs: `pnpm --filter @archipelago/web lint` → exit 0;
`pnpm --filter @archipelago/web typecheck` (`next typegen && tsc --noEmit`) → exit 0.

## Green on entry

None (first entry).

## Test file hashes

| Test file | SHA-256 |
| --------- | ------- |
| `src/proxy.spec.ts` | `eeb65457a5c73c895120b1523b23e85db587172cd9d42e291cf32d474ac1c8a2` |
| `src/app/[locale]/layout.spec.tsx` | `3a4491b496f87756f460c5989c82bfdbdd0b2fed97d933cc3c1c7a4cf71e6296` |
| `src/app/[locale]/page.spec.tsx` | `9eff7f4b9c54aaf035f88df48ec5437b210721aa9e1f0e3fe2d24bb3d7fd1f5d` |
| `src/features/i18n/locale-toggle.spec.tsx` | `7ac32ee96f85a9c5757438df152235ea9e6f2d18c2b51e5458297edb21396ffe` |
| `src/features/i18n/locale.spec.ts` | `938bd20060731713243c481b7956dfcf4b3fe36e1cecd563ce89c0ddf6fa3be6` |
| `src/features/i18n/messages.spec.ts` | `5545ac010ccab51b3ee4b1ad12ae48c91b1934bd638722a2f40151c7d70b84e0` |
| `src/features/i18n/set-locale-cookie.spec.ts` | `0dfa6f3b15bff379dfbd29bf7e65e97bd00c45fe85f18b655b5382c92c003464` |
