---
id: US-01-09-web
epic: EPIC-01
layer: web
title: Forgot password and Check your inbox
risk: normal
depends_on: US-01-09-api
brd_refs: [FR-006]
epic_refs: [RESET-AC-01, RESET-AC-04, RESET-AC-11, UI-06, UI-07]
version: 1
---

# US-01-09-web — Forgot password and Check your inbox

**As** a user **I want** to request a reset link **so that** I can set a new password.

- **AC-1** Given `/forgot-password`, when I submit an email, then **Check Your Inbox** shows the
  same text for any email. _(RESET-AC-01, UI-06, UI-07)_
- **AC-2** Given an invalid email format, then an inline error is shown and the value is kept.
  _(RESET-AC-11, UI-06)_
- **AC-3** Given Check Your Inbox, then Resend is disabled for 60 s, then shows loading and
  errors. _(RESET-AC-04, UI-07)_
- **AC-4** Given a server error, then a retry message is shown. _(RESET-AC-11)_

UI: `epic-01-auth/forgot-password-states.png`. Strings: `en` + `uk`.
