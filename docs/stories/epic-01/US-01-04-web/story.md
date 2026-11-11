---
id: US-01-04-web
epic: EPIC-01
layer: web
title: Session Expired and recovery
risk: high
depends_on: US-01-04-api
brd_refs: [FR-003]
epic_refs: [SES-AC-08…11, UI-03]
version: 1
---

# US-01-04-web — Session Expired and recovery

**As** a user whose session ended **I want** to be told and to sign in again **so that** I can
continue where I was.

- **AC-1** Given the BFF access credential expires, then it is refreshed transparently.
  _(SES-05)_
- **AC-2** Given the session is expired, revoked or replaced, when I use a protected page or BFF
  route, then access is denied and **Session Expired** is shown without any Dashboard link.
  _(SES-AC-08, 09, 11)_
- **AC-3** Given I sign in from Session Expired, then I return to my previous internal page if it
  is still allowed, else `/dashboard`. _(SES-AC-10, LOGIN-02)_
- **AC-4** Given a return URL that is external, protocol-relative or malformed, then it is
  ignored and I land on `/dashboard`. _(SES-AC-10, §6.4)_
- **AC-5** Given reauthentication runs, then the form shows loading and blocks repeats. _(UI-03)_

UI: `epic-01-auth/session-management-flow.png`. Strings: `en` + `uk`.
