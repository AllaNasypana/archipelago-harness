---
id: US-01-06-web
epic: EPIC-01
layer: web
title: Verify email pages
risk: high
depends_on: US-01-06-api
brd_refs: [FR-005]
epic_refs: [EV-AC-04, EV-AC-10, EV-AC-11, UI-10, UI-11]
version: 1
---

# US-01-06-web — Verify email pages

**As** a user who got the email **I want** a clear verify page **so that** I confirm on purpose.

- **AC-1** Given I open the link, then **Verify Your Email** shows a Verify Email button and
  nothing changes yet. _(EV-AC-04, UI-10)_
- **AC-2** Given I press Verify Email, then the result shows exactly one CTA: **Continue to App**
  with an active session, otherwise **Go to Login**. _(EV-AC-10)_
- **AC-3** Given an expired, invalid or used link, then a safe state explains how to get a new
  link after signing in. _(EV-AC-11, EV-07)_
- **AC-4** Given the verify page, then the token is not leaked via referrer or third-party
  assets. _(§7.8)_

UI: `epic-01-auth/email-verification.png`. Strings: `en` + `uk`.
