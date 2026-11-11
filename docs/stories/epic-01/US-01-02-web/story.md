---
id: US-01-02-web
epic: EPIC-01
layer: web
title: Welcome screen
risk: high
depends_on: null
brd_refs: [FR-007]
epic_refs: [ONB-AC-04…06, ONB-AC-18…20, ONB-AC-23, ONB-AC-29, UI-AC-07, UI-05]
version: 1
---

# US-01-02-web — Welcome screen

**As** a newly registered user **I want** a welcome screen **so that** I can start setup or skip it.

- **AC-1** Given `/welcome` is opened, then it shows **Skip for Now**, centered, without the
  sidebar, whether or not my email is verified. _(ONB-AC-05, UI-AC-06, 07)_
- **AC-2** Given I choose Skip for Now, then I land on `/dashboard` immediately and nothing is
  created. _(ONB-AC-06, 18…20)_
- **AC-3** Given I leave Welcome (skip, navigate away, sign out), then it is never shown again,
  including on later sign-ins. _(ONB-07, D11)_
- **AC-4** Given I skip, then my access and verification status are unchanged. _(ONB-AC-23, 29)_

Notes: Welcome is reachable only as the redirect right after registration (a one-time flag in
the BFF session); no server-side onboarding state is stored.

UI: `epic-01-auth/sign-in-welcome.png`; `general/workspace-welcome-screen.png` is superseded (C11).
"Create First Project" ships with the onboarding steps (D-01-01). Strings: `en` + `uk`.
