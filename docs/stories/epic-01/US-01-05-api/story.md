---
id: US-01-05-api
epic: EPIC-01
layer: api
title: Sign out
risk: high
depends_on: null
brd_refs: [FR-004]
epic_refs: [SES-AC-05]
version: 1
---

# US-01-05-api — Sign out

**As** a user **I want** signing out to end my session on the server **so that** nobody can reuse it.

- **AC-1** Given a signed-in session, when sign-out is requested, then its credentials are
  revoked. _(SES-AC-05)_
- **AC-2** Given revoked credentials, then any later refresh or protected call is rejected.
  _(SES-AC-05, §6.3)_

Notes: module `identity`.
