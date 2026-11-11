---
id: US-00-01-web
epic: EPIC-00
layer: web
title: Localization setup
risk: normal
depends_on: null
brd_refs: [NFR-005]
epic_refs: [UI-AC-05]
version: 1
---

# US-00-01-web — Localization setup

**As** a user **I want** the interface in English or Ukrainian **so that** I can work in my
language.

- **AC-1** Given a first visit, then the UI is in English. _(UI-AC-05)_
- **AC-2** Given I choose **УКР** in the language toggle, then all externalized strings switch to
  `uk` and the choice is kept for my next visit in this browser. _(UI-AC-05, A4)_
- **AC-3** Given a component renders text, then it comes from `en`/`uk` message files; a missing
  `uk` key falls back to `en`. _(UI-AC-05)_
- **AC-4** Given the toggle, then it is labelled **EN / УКР**, is keyboard-operable and marks the
  active language without relying on color. _(NFR-005)_

Notes: i18n library chosen in PLANNING; per-account language persistence is
EPIC-09 (FR-009).
