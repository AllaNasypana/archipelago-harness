---
id: US-01-05-web
epic: EPIC-01
layer: web
title: Log out from the profile menu
risk: high
depends_on: US-01-05-api
brd_refs: [FR-004, FR-045]
epic_refs: [SES-AC-05…07, UI-04]
version: 1
---

# US-01-05-web — Log out from the profile menu

**As** a user **I want** to log out from the profile menu **so that** my account is safe on this
browser.

- **AC-1** Given I choose Log out in the profile menu, then the BFF session and its credentials
  are revoked. _(SES-AC-05, UF-04, FR-045)_
- **AC-2** Given log out finishes, then Login shows "You have been signed out". _(SES-AC-07)_
- **AC-3** Given other open tabs, then they show the signed-out state. _(SES-AC-06)_
- **AC-4** Given a tab did not get the notice, then its next protected request is still denied.
  _(SES-AC-06, §7.7)_

UI: `general/alignment-dashboard-profile-menu.png`. Strings: `en` + `uk`.
