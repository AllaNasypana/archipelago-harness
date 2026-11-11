---
id: US-01-10-api
epic: EPIC-01
layer: api
title: Reset the password
risk: high
depends_on: null
brd_refs: [FR-006, BR-002, BR-003]
epic_refs: [RESET-AC-02, RESET-AC-05…08, RESET-AC-10, SES-AC-12]
version: 1
---

# US-01-10-api — Reset the password

**As** a user with a reset link **I want** to set a new password **so that** I can sign in again.

- **AC-1** Given a valid token and a password meeting BR-002 (the current one is allowed), then
  the password changes and the token is consumed in one transaction. _(RESET-AC-05…07)_
- **AC-2** Given success, then all sessions and refresh credentials of the user are revoked on
  every device. _(RESET-AC-08, SES-AC-12)_
- **AC-3** Given an expired (≥ 30 min), used or unknown token, then nothing changes.
  _(RESET-AC-02, 10)_
- **AC-4** Given two concurrent submissions with one token, then only one succeeds.
  _(RESET-AC-07, NFR-003)_
- **AC-5** Given success, then no session credentials are returned. _(RESET-03)_

Notes: module `identity`.
