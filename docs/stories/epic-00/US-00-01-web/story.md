---
id: US-00-01-web
epic: EPIC-00
layer: web
title: Localization setup
risk: normal
depends_on: null
brd_refs: [NFR-005]
epic_refs: [UI-AC-05]
version: 2
---

# US-00-01-web — Localization setup

**As** a user **I want** the interface in English or Ukrainian **so that** I can work in my
language.

- **AC-1** Given a first visit to a URL without a locale prefix, then I am redirected to the same
  path under `/en` and the UI is in English. _(UI-AC-05, D-01-10)_
- **AC-2** Given I choose **УКР** in the language toggle, then I land on the same path and query
  under `/uk`, all externalized strings are in Ukrainian, `<html lang>` is `uk`, and a later visit
  to a URL without a prefix in this browser opens `/uk`. _(UI-AC-05, A4, D-01-10)_
- **AC-3** Given a component renders text, then it comes from `en`/`uk` message files; a missing
  `uk` key falls back to `en`, and a test fails when a key exists in only one of `en`/`uk`.
  _(UI-AC-05)_
- **AC-4** Given the toggle, then it is two buttons labelled **EN** and **УКР**, is
  keyboard-operable, and marks the active language with `aria-pressed` and bold, underlined text,
  not color alone. _(NFR-005, A4)_

Notes: i18n library chosen in PLANNING; per-account language persistence is
EPIC-09 (FR-009). Placing the toggle is US-00-03-web (auth layout) and US-00-04-web (header).
Typed form values are not preserved on a language switch; locale-aware date/number formatting is
out of scope. Decisions: `clarification.md`.
