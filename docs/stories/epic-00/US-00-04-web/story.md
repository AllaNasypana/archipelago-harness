---
id: US-00-04-web
epic: EPIC-00
layer: web
title: App shell
risk: normal
depends_on: null
brd_refs: [FR-045, NFR-005]
epic_refs: ['§8 shared visual language', 'UF-04 step 1']
version: 1
---

# US-00-04-web — App shell

**As** a signed-in user **I want** a consistent header and sidebar **so that** I can move around
the app.

- **AC-1** Given a protected page, then the header shows the logo, the EN/УКР toggle and a
  profile button (initials + full name). _(D17, FR-045)_
- **AC-2** Given the sidebar, then it lists Dashboard, Projects, Goals, Contributions, Weekly
  Focus, Reflection, then a Workspace group with Settings and Account, and can be collapsed.
  _(D17)_
- **AC-3** Given I open the profile button, then a keyboard-operable menu shows Log out; other
  items are added by the stories that own their pages (D-01-07). _(UF-04, NFR-005)_
- **AC-4** Given `/dashboard`, then a placeholder page renders inside the shell. _(D-01-02)_

UI: `general/alignment-dashboard.png`, `general/alignment-dashboard-profile-menu.png` (only valid
shell). Log out wiring: US-01-05-web. Strings: `en` + `uk`.
