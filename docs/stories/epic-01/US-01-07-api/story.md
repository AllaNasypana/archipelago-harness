---
id: US-01-07-api
epic: EPIC-01
layer: api
title: Verification status and resend
risk: high
depends_on: null
brd_refs: [FR-005, BR-004, NFR-008]
epic_refs: [EV-AC-02, EV-AC-06, EV-AC-07, EV-AC-09, EV-AC-12]
version: 1
---

# US-01-07-api — Verification status and resend

**As** a signed-in user **I want** to see whether my email is verified and get a new link
**so that** I can finish verification later.

- **AC-1** Given a signed-in user, then their email and verification status can be read.
  _(EV-AC-09)_
- **AC-2** Given an unverified user, then no API rejects them for being unverified.
  _(EV-AC-02, LOGIN-03)_
- **AC-3** Given a resend less than 60 s after the last one, then it is refused with the time
  left; repeated resends are rate-limited. _(EV-AC-06, NFR-008)_
- **AC-4** Given a resend is accepted, then earlier unused tokens stop working. _(EV-AC-07)_
- **AC-5** Given no authenticated session (e.g. only an old link), then resend is refused.
  _(EV-AC-12)_

Notes: module `identity`.
