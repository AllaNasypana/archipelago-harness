---
id: US-01-01-web
epic: EPIC-01
layer: web
title: Sign-in page
risk: high
depends_on: US-01-01-api
brd_refs: [FR-002]
epic_refs: [LOGIN-AC-01…04, UI-02]
version: 1
---

# US-01-01-web — Sign-in page

**As** a visitor **I want** a sign-in page **so that** I can get into the app.

- **AC-1** Given `/login`, then I see Email, Password, Sign In, Forgot Password and a link to
  registration; no Remember Me. _(LOGIN-AC-01, UI-02)_
- **AC-2** Given valid credentials, then a BFF session is created and I land on `/dashboard`.
  _(LOGIN-AC-03)_
- **AC-3** Given invalid credentials, then "Invalid email or password" is shown and the email
  stays filled. _(LOGIN-AC-02, 04)_
- **AC-4** Given the API rate-limits me, then a retry message is shown without a fixed timer
  value. _(UI-02)_
- **AC-5** Given the request runs, then Sign In shows loading and cannot be sent twice.
  _(LOGIN-AC-04)_

UI: `epic-01-auth/login-page.png`, `sign-in-states.png`. Strings: `en` + `uk`.
