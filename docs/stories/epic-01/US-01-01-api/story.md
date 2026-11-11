---
id: US-01-01-api
epic: EPIC-01
layer: api
title: Sign in with email and password
risk: high
depends_on: null
brd_refs: [FR-002, BR-003, BR-005]
epic_refs: [LOGIN-AC-02, LOGIN-AC-05…08, SES-AC-11]
version: 1
---

# US-01-01-api — Sign in with email and password

**As** a registered user **I want** to sign in **so that** I can reach my workspace.

- **AC-1** Given a correct email (any case) and password, then session credentials are issued,
  also when the email is unverified; no strength check is applied. _(LOGIN-AC-08, PWD-02)_
- **AC-2** Given an unknown email or a wrong password, then the response is identical: "Invalid
  email or password". _(LOGIN-AC-02, BR-005)_
- **AC-3** Given a successful sign-in, then every earlier session of that user is rejected on its
  next use, on any device. _(LOGIN-AC-07, SES-AC-11, BR-003)_
- **AC-4** Given repeated failures for one account or IP, then responses slow down progressively
  and are rate-limited with a retry hint. _(LOGIN-AC-05, NFR-008)_
- **AC-5** Given any number of failures, then the account is never locked permanently.
  _(LOGIN-AC-06)_

Notes: module `identity`; generation/versioning per the session ADR (D-01-03). Thresholds decided in
CLARIFICATION.
