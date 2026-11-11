---
id: US-01-06-api
epic: EPIC-01
layer: api
title: Verify email
risk: high
depends_on: null
brd_refs: [FR-005, BR-004]
epic_refs: [EV-AC-01, EV-AC-03…05, EV-AC-11]
version: 1
---

# US-01-06-api — Verify email

**As** a new user **I want** to confirm my email **so that** my account is marked verified.

- **AC-1** Given a `UserRegistered` event, then a verification email with a 24-hour one-time link
  is sent after commit; only the token hash is stored. _(EV-AC-01, 03, EV-02)_
- **AC-2** Given a token check (read-only), then the token is not consumed. _(EV-AC-04)_
- **AC-3** Given a valid token, when verification is submitted (POST), then the email becomes
  Verified once and the token is consumed. _(EV-AC-04, 05)_
- **AC-4** Given an expired, used or unknown token, then the result is a neutral state that does
  not reveal account data. _(EV-AC-11, EV-06)_
- **AC-5** Given a token at or after `expiresAt`, then it is rejected. _(EV-AC-03)_

Notes: module `identity`; email template content per UI-14 (CTA, 24-hour note, fallback URL,
security note).
