---
id: US-00-01-api
epic: EPIC-00
layer: api
title: Database access and Unit of Work
risk: high
depends_on: null
brd_refs: [BR-001, NFR-003]
epic_refs: [REG-03, '§6.1']
version: 2
---

# US-00-01-api — Database access and Unit of Work

**As** a backend developer **I want** one Prisma access point and a Unit of Work **so that**
modules can commit cross-module changes in a single PostgreSQL transaction.

- **AC-1** Given `DATABASE_URL` for `app_user` and schema `app`, when the API starts, then it
  connects through the single database access point using only those credentials and that
  schema. _(§6.1, AGENTS.md §3.4)_
- **AC-2** Given a use case that writes in two modules, when it runs inside the Unit of Work,
  then both writes commit together or neither does. _(REG-03, BR-001; proven with two test
  module adapters, C1)_
- **AC-3** Given a write in the Unit of Work fails, then every earlier write in it is rolled back
  and the original error reaches the caller unchanged. _(REG-AC-10, C4)_
- **AC-4** Given `DATABASE_URL` is missing or names another user or schema, when the API starts,
  then it refuses to start with a message that names the problem and contains no connection
  string or password. _(AGENTS.md §3.4, §7, C5)_

Notes: `infrastructure/database`; modules receive a transaction-scoped port, never the Prisma
client of another module. Explicit transaction context (C2); READ COMMITTED, no retry (C3); no
production model or migration in this story (C1).
