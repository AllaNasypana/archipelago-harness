---
id: US-00-01-api
epic: EPIC-00
layer: api
title: Database access and Unit of Work
risk: high
depends_on: null
brd_refs: [BR-001, NFR-003]
epic_refs: [REG-03, '§6.1']
version: 1
---

# US-00-01-api — Database access and Unit of Work

**As** a backend developer **I want** one Prisma access point and a Unit of Work **so that**
modules can commit cross-module changes in a single PostgreSQL transaction.

- **AC-1** Given the API starts, when it connects, then it uses the `app` schema with
  `app_user` credentials only. _(§6.1, AGENTS.md §3.4)_
- **AC-2** Given a use case that writes in two modules, when it runs inside the Unit of Work,
  then both writes commit together or neither does. _(REG-03, BR-001)_
- **AC-3** Given a write in the Unit of Work fails, then earlier writes in it are rolled back and
  the error reaches the caller. _(REG-AC-10)_

Notes: `infrastructure/database`; modules receive a transaction-scoped port, never the Prisma
client of another module.
