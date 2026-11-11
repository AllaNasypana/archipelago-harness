---
id: US-00-03-web
epic: EPIC-00
layer: web
title: Auth layout and form fields
risk: normal
depends_on: null
brd_refs: [NFR-005, NFR-007]
epic_refs: [UI-AC-01…04, UI-AC-06]
version: 1
---

# US-00-03-web — Auth layout and form fields

**As** a visitor **I want** clear, consistent auth forms **so that** signing up and in is easy.

- **AC-1** Given any auth or Welcome page, then it uses a centered layout with the logo and no
  sidebar. _(UI-AC-06)_
- **AC-2** Given a password field, then it is hidden by default and has an accessible Show/Hide
  toggle. _(UI-AC-01, 02, PWD-03)_
- **AC-3** Given a field error, then the message appears next to the field and is linked to it for
  screen readers. _(UI-AC-03)_
- **AC-4** Given a submit button while a request runs, then it shows loading and cannot submit
  again. _(UI-AC-04)_
- **AC-5** Given the layout at 360 px, then there is no horizontal scroll. _(NFR-006)_

Notes: the EN/УКР toggle from US-00-01-web sits top-right on this layout (D-01-05).

UI: `epic-01-auth/login-page.png`, `create-account.png` (frame only). Strings: `en` + `uk`.
