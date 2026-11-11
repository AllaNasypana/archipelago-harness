---
id: US-01-11-web
epic: EPIC-01
layer: web
title: Continue with Google buttons and flow
risk: high
depends_on: US-01-11-api
brd_refs: [FR-047]
epic_refs: [GOOG-AC-01, GOOG-AC-04, GOOG-AC-08, GOOG-AC-10, UI-19]
version: 1
---

# US-01-11-web — Continue with Google buttons and flow

**As** a visitor **I want** a Continue with Google button **so that** I can sign up or sign in in
one click.

- **AC-1** Given `/login`, `/register` or Session Expired, then **Continue with Google** is shown
  at the top, above an "or" divider and the email form; `/register` also shows "By continuing with Google, you agree to the
  Terms of Service and Privacy Policy". _(GOOG-AC-01, UI-01…03)_
- **AC-2** Given I press it, then the button shows loading, and the BFF stores `state`, nonce,
  PKCE verifier, timezone, locale and a validated `returnTo` in a short-lived HttpOnly cookie
  and redirects to Google. _(UI-19, ADR-002)_
- **AC-3** Given Google redirects back with a matching `state`, then a BFF session is created and
  I land on `/welcome` (new account), `/dashboard`, or the revalidated `returnTo` after Session
  Expired. _(GOOG-AC-04, GOOG-06)_
- **AC-4** Given I cancelled, `state` mismatches or the API rejects, then I return to the
  starting page with "Couldn't sign in with Google. Try again or use your email." _(GOOG-AC-08)_
- **AC-5** Given the flow, then the code, ID token and query string never reach client code,
  browser storage or logs. _(GOOG-AC-10, NFR-001)_

UI: `epic-01-auth/google-sign-in-screens.png` with the corrections in the design README (consent
line under the Google button, EN/УКР, D17 shell); button per Google branding guidelines. Strings: `en` + `uk`.
