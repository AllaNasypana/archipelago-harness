---
id: US-01-09-api
epic: EPIC-01
layer: api
title: Request a password reset
risk: high
depends_on: null
brd_refs: [FR-006, BR-004, BR-005]
epic_refs: [RESET-AC-01…04]
version: 1
---

# US-01-09-api — Request a password reset

**As** a user who forgot the password **I want** a reset link **so that** I can regain access.

- **AC-1** Given any email, then the response is the same whether the account exists or not.
  _(RESET-AC-01, BR-005)_
- **AC-2** Given an existing account, then a reset email with a 30-minute one-time link is sent
  after commit; only the token hash is stored. _(RESET-AC-02)_
- **AC-3** Given a new request, then earlier unused reset tokens stop working. _(RESET-AC-03)_
- **AC-4** Given a request within 60 s of the last one, then no new email is sent; requests are
  rate-limited, still with a neutral response. _(RESET-AC-04, NFR-008)_
- **AC-5** Given a token check (read-only), then it reports valid / invalid without consuming it.
  _(RESET-AC-11 support)_

Notes: module `identity`.
