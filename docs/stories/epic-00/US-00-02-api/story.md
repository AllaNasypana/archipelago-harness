---
id: US-00-02-api
epic: EPIC-00
layer: api
title: Transactional outbox and email delivery
risk: high
depends_on: null
brd_refs: [BR-001, NFR-004]
epic_refs: [EV-01, UF-01, '§7.10']
version: 1
---

# US-00-02-api — Transactional outbox and email delivery

**As** the system **I want** to send emails only after the triggering change commits **so
that** users never get an email for something that was rolled back.

- **AC-1** Given a use case records an outbox event in its Unit of Work, when the transaction
  rolls back, then no event remains and nothing is sent. _(BR-001, §7.10)_
- **AC-2** Given a committed event, then the dispatcher delivers it through the configured SMTP
  provider (Mailpit locally). _(EV-01, D8)_
- **AC-3** Given delivery fails, then it is retried with backoff and an event is never sent twice
  after it was marked delivered. _(§7.10)_
- **AC-4** Given any delivery attempt, then logs contain the event ID and status but no token,
  link or password. _(NFR-004)_

Notes: `infrastructure/outbox`, `infrastructure/email`; event handlers live in the owning modules.
The event carries the request locale; templates exist in `en` and `uk`, `en` fallback (D-01-04).
