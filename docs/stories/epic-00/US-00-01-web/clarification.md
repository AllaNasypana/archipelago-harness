---
artifact_type: clarification
story: US-00-01-web
layer: web
version: 1
status: APPROVED
interview: done
updated_at: 2026-11-12T09:46:03Z
produced_by: story-clarifier
inputs:
  - { path: docs/stories/epic-00/US-00-01-web/story.md, version: 2 }
  - { path: docs/stories/epic-01/decisions.md, version: 3 }
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md, version: 1.2 }
  - { path: docs/design/README.md }
---

# US-00-01-web — Clarification

## Hypothesis

The story lays the i18n foundation for `apps/web`: `en`/`uk` message files, a locale resolved
on the server per browser (English by default), a fallback to `en` for missing `uk` keys, and a
reusable, accessible EN / УКР toggle component that US-00-03-web and US-00-04-web place on their
layouts.

## Questions

### Q1 [scope] — Where the toggle is visible after this story

- **Status:** answered
- **Question:** This story ships the toggle as a component; the auth layout (US-00-03-web,
  D-01-05) and the app-shell header (US-00-04-web) place it. Is it acceptable that after this
  story the toggle is not on any real page and AC-2 / AC-4 are proven by component and
  integration tests only?
- **Why it matters:** Decides whether the story adds a temporary host page (throwaway UI) or
  touches layouts owned by other stories.
- **Recommended:** Yes — no temporary page; tests cover the behavior, placement stays in
  US-00-03/04-web.
- **Answer:** "Так, лише тести"
- **Decision:** No host page in this story; AC-2 and AC-4 are proven by component and
  integration tests. Placement belongs to US-00-03-web and US-00-04-web.

### Q2 [navigation] — Locale in the URL or not

- **Status:** answered
- **Question:** Is the language part of the URL (`/uk/projects`) or only a per-browser preference
  with the same URLs for both languages?
- **Why it matters:** URL locale changes every route, links, redirects and `returnTo` across all
  later web stories; a preference keeps routes unchanged.
- **Recommended:** No locale in the URL. The app is private (no SEO need), FR-009 later moves the
  preference to the account, and same URLs keep `returnTo` simple. Stored per browser in a cookie
  so the server renders the right language with no flash of English.
- **Answer:** "Мова в URL"
- **Decision:** The locale is a URL segment (`/en/...`, `/uk/...`) on every UI route; links,
  redirects and `returnTo` keep the current locale. Epic-wide: D-01-10.

### Q3 [acceptance] — Missing `uk` keys: tolerated or a failing check

- **Status:** answered
- **Question:** AC-3 says a missing `uk` key falls back to `en`. Should a test also fail when
  `uk` lacks a key that `en` has, or are gaps allowed until MVP hardening?
- **Why it matters:** UI-AC-05 allows the Ukrainian pass during MVP hardening, but every web story
  is expected to ship `en` + `uk` keys (backlog coverage note). A strict check enforces that; a
  lenient one lets gaps accumulate silently.
- **Recommended:** Strict key-parity test from now on (every `en` key exists in `uk` and vice
  versa); the runtime fallback still protects users if one slips through.
- **Answer:** "Строгий тест"
- **Decision:** A key-parity test fails when a key exists in one of `en`/`uk` and not the other;
  the runtime `en` fallback stays. Enforces the backlog note "every web story ships `en` + `uk`
  keys".

### Q4 [a11y] — Toggle form and the `lang` attribute

- **Status:** answered
- **Question:** Toggle as two buttons (segmented control) with the active one marked by
  `aria-pressed` plus a non-color cue (weight/underline), and `<html lang>` following the active
  locale?
- **Why it matters:** AC-4 requires not relying on color; WCAG 3.1.1 needs the page language.
- **Recommended:** Yes — a two-button group, active marked with `aria-pressed="true"` and bold text
  with an underline; `<html lang="en|uk">`.
- **Answer:** "Так"
- **Decision:** Two-button group EN | УКР; active button `aria-pressed="true"`, bold and
  underlined; `<html lang>` is `en` or `uk` per the active locale.

### Q5 [states] — What happens on switch

- **Status:** answered
- **Question:** With the locale in the URL (Q2, Q8), switching is a client-side navigation to the
  other prefix. Is it acceptable that values typed into a form on that page may be lost?
- **Why it matters:** Users may switch on the sign-in or registration form after typing; keeping
  values across a locale navigation needs extra state handling in every form.
- **Recommended:** Acceptable — client-side navigation (no full reload), entered form values are
  not preserved. The toggle sits in the header, users normally choose the language before typing.
- **Answer:** "Ок, не зберігати"
- **Decision:** Switching is a client-side navigation to the other prefix; entered form values are
  not preserved.

### Q6 [scope] — Locale-aware formatting of dates and numbers

- **Status:** answered-from-repo
- **Question:** Is formatting dates/numbers per locale out of this story?
- **Why it matters:** Date/time handling is an undecided project convention (AGENTS.md §5).
- **Recommended:** Out of scope; this story only translates strings.
- **Answer:** AGENTS.md §5 lists date/time handling as an undecided project convention that is not
  invented per story; the story's ACs cover strings only (UI-AC-05).
- **Decision:** Locale-aware date/number formatting is out of scope.

### Q8 [navigation] — Unprefixed URLs and remembering the choice

- **Status:** answered
- **Question:** With the locale in the URL, what does a URL without a prefix (`/`, `/login`) do,
  and how is AC-2 "kept for my next visit in this browser" met?
- **Why it matters:** Defines the proxy redirect and where the remembered choice lives; old links,
  emails and `returnTo` values without a prefix must still work.
- **Recommended:** Both locales are always prefixed (`/en`, `/uk`). An unprefixed URL redirects to
  the same path under the remembered locale (a `locale` cookie, set when
  the toggle is used), else `/en`. The toggle navigates to the same path and query under the other
  prefix.
- **Answer:** "Обидва з префіксом"
- **Decision:** Every UI route is under `/en` or `/uk`. An unprefixed UI URL redirects (same path
  and query) to the locale in the `locale` cookie, else `/en`. The toggle sets the cookie and
  navigates to the same path and query under the other prefix.

### Q7 [scope] — First visit and account language

- **Status:** answered-from-repo
- **Question:** Does a first visit detect the browser language, and does an account preference
  override the browser choice?
- **Why it matters:** Defines the locale resolution order.
- **Recommended:** —
- **Answer:** AC-1 and BRD rule (UI available in English (default) and Ukrainian, line "all
  strings externalized from the start") fix English on the first visit; the story note puts
  per-account persistence in EPIC-09 (FR-009, D5).
- **Decision:** Resolution order now: browser preference → `en`. No `Accept-Language` detection.
  The account preference is added by EPIC-09.

## Decisions

- C2 (Q1): no host page; AC-2/AC-4 proven by tests; placement in US-00-03/04-web.
- D-01-10 (Q2): locale is a URL segment on every UI route — recorded in the epic's decisions.md.
- C3 (Q8): both locales prefixed; unprefixed UI URL → same path under the `locale` cookie's locale, else `/en`; the toggle sets the cookie and swaps the prefix.
- C4 (Q3): strict `en`↔`uk` key-parity test; runtime fallback to `en` stays.
- C5 (Q4): two-button toggle, `aria-pressed`, bold + underline for active; `<html lang>` follows the locale.
- C6 (Q5): switching = client-side navigation; typed form values are not preserved.
- C7 (Q6): no locale-aware date/number formatting in this story.
- C1 (Q7): first visit renders in `en`; no browser-language detection; account preference is EPIC-09.

## Assumptions

- None.

## Out of scope

- Per-account language persistence and the Settings language field (EPIC-09, FR-009).
- Placing the toggle on the auth layout and the app header (US-00-03-web, US-00-04-web).
- Translating user-authored content (BRD: never auto-translated).
- Locale-aware date/number formatting (AGENTS.md §5 convention not decided).
- Preserving typed form values across a locale switch.
- Localizing BFF route handlers under `app/api` (not UI routes).

## Needs an ADR

- None.

## Spec checklist

- Route structure: a `[locale]` segment over all UI route groups (`(public)`, `(auth)`,
  `(protected)`), allowed values `en` | `uk`; an unknown segment value → not found.
- Proxy (`proxy.ts`, web-patterns): unprefixed UI URL → redirect to the same path and query under
  the `locale` cookie's locale, else `en`; `app/api` and static assets are not redirected; how it
  composes with the existing session redirects.
- `locale` cookie: name, attributes (path, `SameSite`, max-age), when it is written; it holds no
  secret.
- Message files: location, format, key naming; how Server and Client Components get messages;
  fallback to `en` for a missing `uk` key.
- Key-parity test (C4).
- Root layout: `<html lang>` follows the locale (C5).
- Toggle component: props, markup (two buttons, `aria-pressed`), non-color active cue, keyboard,
  target URL (same path and query, other prefix), cookie write; `en`/`uk` keys for its own
  accessible label.
- UI states: none beyond the toggle (no loading/error states).
- Tests per AC: first visit renders `en`; switching renders `uk` and remembers it; fallback;
  toggle a11y.
- i18n library is chosen in PLANNING (story note).

## Story changes

Edits to story.md, applied after the human's "так" (story.md v2):

- AC-1 changed to: Given a first visit to a URL without a locale prefix, then I am redirected to
  the same path under `/en` and the UI is in English. _(UI-AC-05, D-01-10)_
- AC-2 changed to: Given I choose **УКР** in the language toggle, then I land on the same path and
  query under `/uk`, all externalized strings are in Ukrainian, `<html lang>` is `uk`, and a later
  visit to a URL without a prefix in this browser opens `/uk`. _(UI-AC-05, A4, D-01-10)_
- AC-3 extended: …; a test fails when a key exists in only one of `en`/`uk`. _(UI-AC-05)_
- AC-4 changed to: Given the toggle, then it is two buttons labelled **EN** and **УКР**, is
  keyboard-operable, and marks the active language with `aria-pressed` and bold, underlined text,
  not color alone. _(NFR-005, A4)_
- Notes: placing the toggle is US-00-03-web (auth layout) and US-00-04-web (header); form values
  are not preserved on switch; date/number formatting is out of scope.
