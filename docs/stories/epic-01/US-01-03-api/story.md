---
id: US-01-03-api
epic: EPIC-01
layer: api
title: Register an account
risk: high
depends_on: null
brd_refs: [FR-001, BR-001, BR-002, BR-006]
epic_refs: [REG-AC-02…07, REG-AC-09, REG-AC-10, ONB-AC-01, ONB-AC-02]
version: 1
---

# US-01-03-api — Register an account

**As** a visitor **I want** to create an account **so that** I get my own workspace and am
signed in.

- **AC-1** Given valid Full Name, email, password, confirmation and consent, then User
  (Unverified, browser timezone or UTC), personal Workspace, OWNER Membership and a
  `UserRegistered` outbox event are committed in one transaction, and session credentials are
  returned. _(REG-AC-07, 09, ONB-AC-01, 02, REG-05)_
- **AC-2** Given an email already registered in any letter case, then the response says "This
  email is already registered" and nothing is created. _(REG-AC-03, 04, BR-005)_
- **AC-3** Given an invalid field (name 2–100 trimmed, email syntax, password policy, mismatched
  confirmation, missing consent), then field errors are returned and nothing is created.
  _(REG-AC-02, 05, 06, BR-002, BR-006)_
- **AC-4** Given any failure inside the transaction, then no user, workspace or membership
  remains. _(REG-AC-10)_
- **AC-5** Given a stored account, then the password exists only as an adaptive hash.
  _(§7.2)_

Notes: small-story exception — spans `workflows/registration`, `identity` and `workspaces`
because provisioning must be one Unit of Work (BR-001, AGENTS.md §3.9). Password-validator parity
cases (Unicode, 128 chars) are part of the contract tests (§7.11).
