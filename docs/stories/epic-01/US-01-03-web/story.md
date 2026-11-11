---
id: US-01-03-web
epic: EPIC-01
layer: web
title: Registration page
risk: high
depends_on: US-01-03-api
brd_refs: [FR-001]
epic_refs: [REG-AC-01…06, REG-AC-08…10, ONB-AC-01, ONB-AC-03, UI-01]
version: 1
---

# US-01-03-web — Registration page

**As** a visitor **I want** a registration form **so that** I can sign up in one step.

- **AC-1** Given `/register`, then I see Full Name, Email, Password with the full policy
  checklist, Confirm Password and the Terms/Privacy consent. _(REG-AC-01, UI-01)_
- **AC-2** Given invalid input, then inline errors match the API rules before submission.
  _(REG-AC-02, 05, 06; mirrors BR-002, BR-006)_
- **AC-3** Given a duplicate email, then "This email is already registered" is shown with a
  Login link. _(REG-AC-04)_
- **AC-4** Given success, then a BFF session is created and Welcome opens. _(REG-AC-08, 09,
  ONB-AC-01, 03)_
- **AC-5** Given the account was created but the session could not be established, then I am
  sent to Login with an explanation and the form cannot re-submit. _(REG-AC-10, UF-01 step 7)_

UI: `epic-01-auth/create-account.png`, `registration-states.png`; mockup password hint "6–15
chars" is superseded by BR-002. Timezone is sent from the browser, no field. Strings: `en` + `uk`.
