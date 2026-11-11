---
id: US-01-04-api
epic: EPIC-01
layer: api
title: Session refresh and lifetime
risk: high
depends_on: null
brd_refs: [FR-003, BR-003]
epic_refs: [SES-AC-01…03, SES-AC-08]
version: 1
---

# US-01-04-api — Session refresh and lifetime

**As** the system **I want** to rotate and expire session credentials **so that** stolen or old
sessions stop working.

- **AC-1** Given a valid refresh credential, then new credentials are issued and the old refresh
  credential is rejected afterwards. _(SES-AC-03)_
- **AC-2** Given 30 days since the session was created, then refresh and protected calls are
  rejected, whatever the rotation history. _(SES-AC-01, 03)_
- **AC-3** Given 7 days without qualifying activity, then the session is rejected. _(SES-AC-02)_
- **AC-4** Given a revoked or replaced session, then every protected API call is rejected.
  _(SES-AC-08)_

Notes: module `identity`; "qualifying activity" defined in CLARIFICATION (D-01-03).
