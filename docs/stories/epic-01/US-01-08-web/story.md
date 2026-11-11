---
id: US-01-08-web
epic: EPIC-01
layer: web
title: Email status in Account settings
risk: normal
depends_on: US-01-07-api
brd_refs: [FR-005, FR-008]
epic_refs: [EV-AC-06, EV-AC-09, UI-13]
version: 1
---

# US-01-08-web — Email status in Account settings

**As** a user **I want** to see my email status in Account **so that** I can resend the link
any time.

- **AC-1** Given `/account`, then my email shows Verified or Unverified with a text label, not
  color alone. _(EV-AC-09, NFR-005)_
- **AC-2** Given Unverified, then Resend is available; during the 60 s cooldown it is disabled
  with the time left. _(EV-AC-06, UI-13)_
- **AC-3** Given resend runs or fails, then loading and error states are shown. _(UI-13)_
- **AC-4** Given the dashboard banner was dismissed, then the Account status is still shown.
  _(EV-05)_

UI: `epic-01-auth/account-settings-profile.png` (email card only; no avatar, D5). Rest of
Account is EPIC-09 (D-01-06). Strings: `en` + `uk`.
