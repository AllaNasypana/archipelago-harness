---
artifact_type: review
story: US-00-01-web
layer: web
version: 1
status: APPROVED
updated_at: 2026-11-12T10:08:59Z
produced_by: story-reviewer
verdict: PASS
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/clarification.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-web/spec.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/spec-review.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/plan.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-web/tests.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-web/implementation.md, version: 1 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: apps/web/AGENTS.md }
  - { path: apps/web/docs/web-patterns.md }
---

# US-00-01-web — Review

## Verdict

PASS. All checks pass. Each spec AC (AC-1…AC-7) has a passing test, and the test hashes match
`tests.md`. The diff follows plan v1 and its deviations are justified. There are no blocking
security or boundary findings. Six non-blocking findings follow.

## Checks

Run from the repo root on the working tree (base `f32475f` plus the uncommitted implementation).

| Command | Exit | Result |
| ------- | ---- | ------ |
| `pnpm db:up` | 0 | PostgreSQL + Mailpit up |
| `pnpm --filter @archipelago/api prisma:generate` | 0 | client generated |
| `pnpm turbo run lint typecheck test build` | 0 | 12/12 tasks; turbo: `8 cached, 12 total`. The api tasks were replayed from cache; every `@archipelago/web` task (lint, typecheck, test, build) ran fresh. web: eslint clean; `next typegen && tsc --noEmit` clean; vitest **8 files, 76 passed**; `next build` (16.4.5) passed with `globalNotFound` on, `/en` and `/uk` prerendered (○), `/[locale]` partial prerender, Proxy present. api: 18 tests passed (unchanged) |
| `pnpm --filter @archipelago/api test:e2e` | — | Not run. This is a web story and touches no api HTTP flow |
| `shasum -a 256` on the 7 story test files | 0 | All 7 match `tests.md` |
| `grep -rn "document.cookie" apps/web/src` | 1 | No match (plan check) |
| `grep -rn "not implemented\|TEST_FIRST stub\|console\." apps/web/src` | 1 | No stubs or logging left |
| `next start -p 3461` + `curl` (plan manual checks) | — | `/` → 307 `/en`; `/login?returnTo=x` → 307 `/en/login?returnTo=x`; `Cookie: locale=uk` `/login?x=1` → 307 `/uk/login?x=1`; `locale=fr` → `/en/login`; `/en` → `<html lang="en">`; `/uk` → `<html lang="uk">` + "Налаштування робочого простору"; `/en/missing` → 404 `global-not-found` ("Page not found"); `/foo.txt` → 404 Next default page; `/api/x` → 404 without redirect; `/favicon.ico` → 200. Server stopped afterwards |
| Browser toggle check (plan manual check) | — | **Not run, and cannot run yet.** No route mounts `LocaleToggle` (C2), so `setLocaleCookie` is not in the build: `server-reference-manifest.json` is empty. See R2 |

## AC coverage

| AC | Test | Passing |
| -- | ---- | ------- |
| AC-1 | `src/proxy.spec.ts` (`/`, `/login?returnTo=x`, `/a/b` → 307 `/en…`; prefixed paths pass through); `src/app/[locale]/layout.spec.tsx` (`lang="en"`); `src/app/[locale]/page.spec.tsx` (English text) | yes |
| AC-2 | `src/features/i18n/locale-toggle.spec.tsx` (cookie saved before `push('/uk/login?returnTo=x')`, call order checked; navigation still happens when the save fails; clicking the active locale does nothing); `set-locale-cookie.spec.ts` (`locale=uk`, path `/`, Lax, one year, `Secure` from `NODE_ENV`); `locale.spec.ts` (`swapLocale`); layout/page specs (`lang="uk"`, uk messages, uk text) | yes, except `<html lang>` after the client-side navigation. That is unverified for a stated reason: the toggle is not placed (C2) and the plan left it to a manual check (R2) |
| AC-3 | `src/proxy.spec.ts` (cookie `uk` → `/uk`; `en`/`fr`/`UK`/empty → `/en`); `locale.spec.ts` (`localeFromCookie`, `isLocale` boundaries incl. `ук`, ` uk`, `UK`); `set-locale-cookie.spec.ts` (untrusted values set nothing) | yes |
| AC-4 | `src/features/i18n/messages.spec.ts` (missing key, missing namespace, empty string → `en`; `getMessages('uk')` has every `en` key) | yes |
| AC-5 | `src/features/i18n/messages.spec.ts` (synthetic one-sided key in both directions; real `en`/`uk` parity with `onlyInEn`/`onlyInUk` diagnostics) | yes |
| AC-6 | `src/features/i18n/locale-toggle.spec.tsx` (group named "Language"; EN/УКР buttons; `lang="uk"`; `aria-pressed` with `font-semibold underline` only on the active button; Tab order; Enter and Space) | yes |
| AC-7 | `src/proxy.spec.ts` (matcher table: `/api/v1/x`, `/_next/static/a.js`, `/favicon.ico` false; page routes true); `src/app/[locale]/layout.spec.tsx` (`fr`, `EN`, `favicon.ico` → `notFound()`) | yes |

## Findings

| # | Severity | Part | File:line | Finding | Fix |
| - | -------- | ---- | --------- | ------- | --- |
| R1 | non-blocking | Correctness | `apps/web/src/proxy.ts:18` | The matcher `'/((?!api\|_next\|.*\\..*).*)'` excludes more than AC-7 intends. It is copied verbatim from plan D5, which the human approved, so this is a plan-level choice and not an implementation slip. Any path whose first segment **starts with** `api` is skipped, and so is any path with a dot **anywhere**. Checked live: `/apiary` → 404 and `/u/john.doe` → 404, where both should 307 to `/en/…`. No route is affected today, because every UI route is reached through a prefix. An unprefixed link with a dotted segment (for example a future email link) would 404 instead of redirecting. | Anchor the exclusions, e.g. `api(?:/\|$)`, `_next/`, and a file extension only in the last segment. Add `/apiary` and `/a/b.c/d` to the matcher table. This could go in US-00-02-web, which extends `proxy.ts`. |
| R2 | non-blocking | Correctness (unverified) | `apps/web/src/features/i18n/locale-toggle.tsx`, `set-locale-cookie.ts` | Three behaviors are covered only by unit tests with mocked `next/headers` and `next/navigation`: the real `Set-Cookie` from the Server Function, `<html lang>` after the client-side switch (AC-2), and `/` landing on `/uk` after the switch. They cannot be observed end to end yet, because the toggle is not placed (C2) and Next drops the unreferenced Server Function from the build. | US-00-03-web / US-00-04-web, which place the toggle, should run the plan's browser check: URL, `<html lang>`, the `locale` cookie attributes, and `/` → `/uk`. |
| R3 | non-blocking | Readability / i18n | `apps/web/src/app/global-not-found.tsx` | Plan Risk 1 happened (`implementation.md` Deviations). For an invalid `[locale]` (e.g. `/foo.txt`), Next 16.4.5 serves its built-in 404, so the text "This page could not be found" is not externalized. `/en/missing` correctly gets `global-not-found`. The status is 404, so AC-7 holds, and the plan accepted this fallback. | No change in this story. The human decides whether a follow-up should make every 404 use the localized page. |
| R4 | non-blocking | Correctness | `apps/web/src/app/[locale]/layout.tsx:23-28` | `generateMetadata` (title and description from `common.*`, spec Route "Home page") has no test. No AC names it. Checked by reading the code only. | Optional: add a layout test for `generateMetadata` for `uk`. |
| R5 | non-blocking | Readability / performance | `apps/web/src/app/[locale]/layout.tsx:37` | The root layout passes the whole merged dictionary to the client Provider, so every page carries every namespace. That is a few hundred bytes today. | Revisit once the dictionaries grow, e.g. pass only the namespaces Client Components use. No change now. |
| R6 | non-blocking | Readability (docs) | `apps/web/AGENTS.md` Structure tree; `apps/web/docs/web-patterns.md` §2–§3 | Both docs still show `app/layout.tsx` and the route groups directly under `app/`, e.g. `app/(protected)/goals/`. With D-01-10 the root layout and every UI route group live under `app/[locale]/`. A later story that follows the docs literally would put a route outside `[locale]`, where it has no root layout. | Out of this story's scope. These are rule documents and changing them needs approval. The human or orchestrator updates them to `app/[locale]/…`. |

Security and boundaries were checked and nothing was found:

- The `locale` cookie holds no secret. It is written only by a `'use server'` function that guards its input with `isLocale`, with `Path=/`, `SameSite=Lax`, `Secure` in production and a one-year `Max-Age`. There is no `document.cookie` write.
- The proxy only reads the cookie and redirects to the same origin. `nextUrl.clone()` keeps host and query, so there is no open redirect.
- There is no BFF route, no api-client call, no `bff`/`app` schema access, no token or session data in the Provider, no logging and no secrets.
- Strings are in `en` and `uk` with parity enforced by a test. Colors use tokens only (`ring`, `muted-foreground`).
- Scope is limited to `apps/web` plus story docs.

## For the human

- **What to look at in the diff:**
  - `src/proxy.ts`: matcher (R1) and the ordering comment for US-00-02-web.
  - `src/features/i18n/locale-toggle.tsx`: awaits the cookie, then `router.push` with `window.location.search`.
  - `src/features/i18n/messages.ts`: the deep merge, and an `as Messages` cast. The cast is justified because the merge walks only `base` keys.
  - `src/app/[locale]/layout.tsx`: the guard, and no `dynamicParams` because of `cacheComponents`.
  - `next.config.ts`: the experimental `globalNotFound` flag.
- **Already confirmed at the earlier gates:** the two `notFound.*` keys, the spec's `uk` texts and the one-year cookie lifetime (plan D3, spec F5). Reject only if you want to change them.
- **Residual risks:**
  - The real cookie write and the post-switch `<html lang>` are unverified until the toggle is placed (R2).
  - `experimental.globalNotFound` is an experimental Next flag.
  - The invalid-locale 404 is not localized (R3).
- **Follow-ups:**
  - US-00-02-web: tighten the matcher (R1) when extending the proxy.
  - US-00-03-web / US-00-04-web: run the browser toggle check (R2).
  - Update `apps/web/AGENTS.md` and `web-patterns.md` paths to `app/[locale]/…` (R6).
- **Moves are staged:** the moves and deletions (`layout.tsx`, `page.tsx`, `.gitkeep`) are staged; the new files are untracked. Nothing is committed.
