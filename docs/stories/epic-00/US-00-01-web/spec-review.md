---
artifact_type: specification_review
story: US-00-01-web
layer: web
version: 2
status: APPROVED
updated_at: 2026-11-12T09:52:58Z
produced_by: spec-reviewer
verdict: PASS
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-00/US-00-01-web/clarification.md, version: 1 }
  - { path: docs/stories/epic-00/US-00-01-web/spec.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md }
  - { path: docs/design/README.md }
  - { path: apps/web/AGENTS.md }
  - { path: apps/web/docs/web-patterns.md }
---

# US-00-01-web — Spec review

## Verdict

PASS — spec v2 resolves the blocking finding F1 from v1. The toggle now writes the `locale`
cookie through a Server Function (a permitted server response context). The function guards its
input, and the toggle awaits it before navigating. No blocking findings remain.

## Findings

| #  | Severity     | Area           | Spec location                                              | Finding | Fix |
| -- | ------------ | -------------- | ---------------------------------------------------------- | ------- | --- |
| F1 | resolved     | Boundaries / Security | Locale and cookie → Written by, `Secure`, Ordering, CSRF | v1: the cookie write mechanism was unstated. v2: `setLocaleCookie` Server Function with an `isLocale` guard sets the cookie via `cookies().set`, with no `document.cookie` write. `Secure` comes from `NODE_ENV === 'production'` (HTTPS behind Caddy). It is awaited before `router.push`, and a failure still navigates. The CSRF effect is stated. Satisfies `apps/web/AGENTS.md` (cookie mutations only in server response contexts) and C3. | — |
| F2 | resolved     | Testability    | Components → `LocaleToggle`                                | v1: `useSearchParams` would need `<Suspense>`. v2: the query is read from `window.location.search` at click time, so no `useSearchParams`, no boundary, and nothing inherited by US-00-03/04-web. | — |
| F3 | resolved     | Testability    | AC-7; Route → Not found; Open points                       | v1: the invalid-`[locale]` 404 was not testable end-to-end. v2: AC-7 is tested at the layout guard, and the not-found rendering (`global-not-found.js` / `globalNotFound` flag) is assigned to PLANNING as a recorded decision. | — |
| F4 | resolved     | Testability    | Open points                                                | v1: AC-2 `<html lang>` after client navigation was at risk. v2: the test asserts `lang` after the navigation; a full load is acceptable under C6 and gets recorded. | — |
| F5 | non-blocking | Faithfulness   | Locale and cookie → `Max-Age`; Strings `uk` column         | The one-year cookie lifetime and the `uk` texts are still the spec's own proposals. They are flagged for the human. | Human confirms both at `HUMAN_SPEC_APPROVAL`; no spec change. |
| F6 | resolved     | Coverage       | Route → Proxy row                                          | v1: composition with session redirects was missing. v2: the locale redirect runs first; session redirects (US-00-02-web) work on the locale-stripped path and keep the prefix (D-01-10). | — |

## Checked

- Coverage: OK. Story AC-1…AC-4 map to spec AC-1…AC-7. C1–C7 and D-01-10 are reflected. Every Spec-checklist item is answered (route, proxy + ordering, cookie name/attributes/writer, messages, parity test, `<html lang>`, toggle, UI states, tests per AC, library deferred to PLANNING).
- Testability: OK. Each AC is observable alone. The invalid cookie (AC-3), missing key (AC-4), excluded paths and invalid segment (AC-7) have their own ACs. `swapLocale` and `setLocaleCookie` have stated unit tests.
- Faithfulness: OK. No addition beyond story ACs, C1–C7, D-01-10, NFR-005/WCAG. No conflict with BRD A4, UI-AC-05 or D-01-10. F5 is for the human.
- Boundaries: OK. No BFF route, api client, `bff` schema or token use. `app/api` stays outside `[locale]`. The cookie is set only in a Server Function. The i18n Provider is allowed by web-patterns §5.
- Security: OK. The cookie is non-secret and the Server Function input is validated. Server Functions are POST-only with an Origin check, and the CSRF effect is stated. Nothing is logged.
- Contract (web): N/A. `depends_on: null`; no api calls.
- Design: OK. Mockups are cited with the EN / УКР correction (design README, A4). The app-shell rule is N/A (no shell). UI states are stated (none beyond the toggle). Every key has `en` + `uk`. Tokens only.
- Conventions: OK. Date/number formatting is excluded (AGENTS.md §5). The i18n library is chosen in PLANNING per the story note. No new project-wide convention.
- Size and quality: OK. One feature folder, one proxy, one layout move, one Server Function. No speculative layers.
- Risk: OK. The spec raises `risk` to `high` per `story_rules.risk.high_when` ("touches … cookies"; it also creates `proxy.ts`, which the session story extends), so `HUMAN_PLAN_APPROVAL` applies.
