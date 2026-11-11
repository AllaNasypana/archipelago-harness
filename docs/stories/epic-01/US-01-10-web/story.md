---
id: US-01-10-web
epic: EPIC-01
layer: web
title: Reset password form and result
risk: normal
depends_on: US-01-10-api
brd_refs: [FR-006]
epic_refs: [RESET-AC-05, RESET-AC-09, RESET-AC-11, UI-08, UI-09]
version: 1
---

# US-01-10-web — Reset password form and result

**As** a user **I want** a reset form with clear results **so that** I know what to do next.

- **AC-1** Given a valid link, then the form shows New and Confirm Password with Show/Hide and the
  policy checklist, mirroring BR-002. _(RESET-AC-05, UI-08)_
- **AC-2** Given success, then I land on Login with a success message and am not signed in.
  _(RESET-AC-09, UI-09)_
- **AC-3** Given an expired, invalid or used link, then a safe state offers a new reset request.
  _(RESET-AC-11, UI-09)_
- **AC-4** Given submission, then loading blocks duplicates and validation errors are inline.
  _(RESET-AC-11)_

UI: `epic-01-auth/password-reset-states.png`. Strings: `en` + `uk`.
