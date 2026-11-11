---
id: US-00-02-web
epic: EPIC-00
layer: web
title: BFF session store and cookie
risk: high
depends_on: null
brd_refs: [NFR-001, NFR-004]
epic_refs: [SES-05, SES-AC-04, '§7.1']
version: 1
---

# US-00-02-web — BFF session store and cookie

**As** a signed-in user **I want** my credentials kept on the server **so that** scripts in the
browser can never read them.

- **AC-1** Given a session is created, then the browser receives only a random opaque ID in a
  `Secure`, `HttpOnly`, `SameSite` cookie. _(SES-05, §7.1)_
- **AC-2** Given a session, then access and refresh credentials are stored in the `bff` schema
  and never appear in any browser-visible response. _(SES-AC-04, NFR-001)_
- **AC-3** Given no valid session, when a `(protected)` route is opened, then the user is sent to
  Login. _(SES-04)_
- **AC-4** Given a state-changing BFF request from another origin, then it is rejected. _(§7.1)_
- **AC-5** Given any BFF log line, then it contains no session ID, token or password. _(NFR-004)_

Notes: `lib/auth`, `lib/db` (`bff_user` only). Establishing the session after sign-in is done by
US-01-01-web.
