---
id: US-01-07-web
epic: EPIC-01
layer: web
title: Unverified banner on Dashboard
risk: normal
depends_on: US-01-07-api
brd_refs: [FR-005]
epic_refs: [EV-AC-08, UI-12]
version: 1
---

# US-01-07-web — Unverified banner on Dashboard

**As** an unverified user **I want** a gentle reminder **so that** I remember to verify.

- **AC-1** Given my email is unverified, then the Dashboard shows a non-intrusive banner.
  _(EV-AC-08, UI-12)_
- **AC-2** Given I dismiss it, then it stays hidden until this session ends. _(EV-AC-08)_
- **AC-3** Given my email is verified, then no banner is shown. _(EV-05)_

UI: `epic-01-auth/email-verification.png` (banner panel). Strings: `en` + `uk`.
