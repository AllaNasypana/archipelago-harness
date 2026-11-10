---
artifact_type: story_slice
epic: EPIC-01
version: 1
status: DRAFT
produced_by: story-slicer
created_at: 2026-11-09T18:42:18Z
updated_at: 2026-11-10T00:00:00Z
inputs:
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md, version: null }
  - { path: docs/product/archipelago-business-requirements.md, version: '1.1' }
  - { path: docs/design/README.md, version: null }
  - { path: docs/adr/ADR-002-google-sign-in.md, version: null }
supersedes: null
---

# EPIC-01 Authentication and User Onboarding — Story Slice

26 stories: 6 foundation (`US-00`) and 20 epic stories; 11 `api`, 15 `web` in total. Table order is the
delivery order. The onboarding steps (Project → Goal → Weekly Focus) and the Dashboard states
after onboarding are deferred until the EPIC-02/03/06/07 stories they call exist (Q1, Q2).

## Stories

| ID           | Layer | Title                                   | Depends on   | BRD refs                       | Epic refs                                    | ACs |
| ------------ | ----- | --------------------------------------- | ------------ | ------------------------------ | -------------------------------------------- | --- |
| US-00-01-api | api   | Database access and Unit of Work        | —            | BR-001, NFR-003                | REG-03, §6.1                                 | 3   |
| US-00-02-api | api   | Transactional outbox and email delivery | —            | BR-001, NFR-004                | EV-01, UF-01, §7.10                          | 4   |
| US-00-01-web | web   | Localization setup                      | —            | NFR-005                        | UI-AC-05                                     | 4   |
| US-00-02-web | web   | BFF session store and cookie            | —            | NFR-001, NFR-004               | SES-05, SES-AC-04, §7.1                      | 5   |
| US-00-03-web | web   | Auth layout and form fields             | —            | NFR-005, NFR-007               | UI-AC-01…04, UI-AC-06                        | 5   |
| US-00-04-web | web   | App shell                               | —            | FR-045, NFR-005                | §8 shared visual language, UF-04 step 1      | 4   |
| US-01-01-api | api   | Sign in with email and password         | —            | FR-002, BR-003, BR-005         | LOGIN-AC-02, 05…08, SES-AC-11                | 5   |
| US-01-01-web | web   | Sign-in page                            | US-01-01-api | FR-002                         | LOGIN-AC-01…04, UI-02                        | 5   |
| US-01-02-web | web   | Welcome screen                          | —            | FR-007                         | ONB-AC-04…06, 18…20, 23, 29, UI-AC-07, UI-05 | 4   |
| US-01-03-api | api   | Register an account                     | —            | FR-001, BR-001, BR-002, BR-006 | REG-AC-02…07, 09, 10, ONB-AC-01, 02          | 5   |
| US-01-03-web | web   | Registration page                       | US-01-03-api | FR-001                         | REG-AC-01…06, 08…10, ONB-AC-01, 03, UI-01    | 5   |
| US-01-04-api | api   | Session refresh and lifetime            | —            | FR-003, BR-003                 | SES-AC-01…03, 08                             | 4   |
| US-01-04-web | web   | Session Expired and recovery            | US-01-04-api | FR-003                         | SES-AC-08…11, UI-03                          | 5   |
| US-01-05-api | api   | Sign out                                | —            | FR-004                         | SES-AC-05                                    | 2   |
| US-01-05-web | web   | Log out from the profile menu           | US-01-05-api | FR-004, FR-045                 | SES-AC-05…07, UI-04                          | 4   |
| US-01-06-api | api   | Verify email                            | —            | FR-005, BR-004                 | EV-AC-01, 03…05, 11                          | 5   |
| US-01-06-web | web   | Verify email pages                      | US-01-06-api | FR-005                         | EV-AC-04, 10, 11, UI-10, UI-11               | 4   |
| US-01-07-api | api   | Verification status and resend          | —            | FR-005, BR-004, NFR-008        | EV-AC-02, 06, 07, 09, 12                     | 5   |
| US-01-07-web | web   | Unverified banner on Dashboard          | US-01-07-api | FR-005                         | EV-AC-08, UI-12                              | 3   |
| US-01-08-web | web   | Email status in Account settings        | US-01-07-api | FR-005, FR-008                 | EV-AC-06, 09, UI-13                          | 4   |
| US-01-09-api | api   | Request a password reset                | —            | FR-006, BR-004, BR-005         | RESET-AC-01…04                               | 5   |
| US-01-09-web | web   | Forgot password and Check your inbox    | US-01-09-api | FR-006                         | RESET-AC-01, 04, 11, UI-06, UI-07            | 4   |
| US-01-10-api | api   | Reset the password                      | —            | FR-006, BR-002, BR-003         | RESET-AC-02, 05…08, 10, SES-AC-12            | 5   |
| US-01-10-web | web   | Reset password form and result          | US-01-10-api | FR-006                         | RESET-AC-05, 09, 11, UI-08, UI-09            | 4   |
| US-01-11-api | api   | Continue with Google                    | —            | FR-047, BR-033, BR-001, BR-003 | GOOG-AC-02…12                                | 5   |
| US-01-11-web | web   | Continue with Google buttons and flow   | US-01-11-api | FR-047                         | GOOG-AC-01, 04, 08, 10, UI-19                | 5   |

`depends_on` names the one api story whose contract a web story consumes. Web stories with `—`
have no API contract (pure UI or BFF plumbing). Api stories have no `depends_on`: the table order
is the delivery order and only one story is active at a time. Sign in comes before Register so
credential issuance exists when registration signs the user in (REG-04). Google (US-01-11) comes
last: it reuses sign-in, registration, session and reset, and needs ADR-002 approved.

## Coverage

| Epic AC        | Covered by                                | Note                                                        |
| -------------- | ----------------------------------------- | ----------------------------------------------------------- |
| REG-AC-01      | US-01-03-web                              |                                                             |
| REG-AC-02…06   | US-01-03-api, US-01-03-web                | api authoritative; web mirrors (BR-002 parity)              |
| REG-AC-07      | US-01-03-api, US-00-01-api                |                                                             |
| REG-AC-08      | US-01-03-web, US-00-02-web                |                                                             |
| REG-AC-09      | US-01-03-api, US-01-03-web                |                                                             |
| REG-AC-10      | US-01-03-api, US-01-03-web                | api: no partial data; web: post-commit failure → Login      |
| LOGIN-AC-01    | US-01-01-web                              |                                                             |
| LOGIN-AC-02    | US-01-01-api, US-01-01-web                |                                                             |
| LOGIN-AC-03…04 | US-01-01-web                              |                                                             |
| LOGIN-AC-05…08 | US-01-01-api                              |                                                             |
| SES-AC-01…03   | US-01-04-api                              |                                                             |
| SES-AC-04      | US-00-02-web                              |                                                             |
| SES-AC-05      | US-01-05-api, US-01-05-web                |                                                             |
| SES-AC-06…07   | US-01-05-web                              |                                                             |
| SES-AC-08      | US-01-04-api, US-01-04-web                |                                                             |
| SES-AC-09…10   | US-01-04-web                              |                                                             |
| SES-AC-11      | US-01-01-api, US-01-04-web                | api revokes; web shows the replaced-session state           |
| SES-AC-12      | US-01-10-api                              |                                                             |
| EV-AC-01       | US-01-06-api, US-00-02-api                |                                                             |
| EV-AC-02       | US-01-07-api                              | no verification guard anywhere; asserted on sign-in too     |
| EV-AC-03       | US-01-06-api                              |                                                             |
| EV-AC-04       | US-01-06-api, US-01-06-web                |                                                             |
| EV-AC-05       | US-01-06-api                              |                                                             |
| EV-AC-06       | US-01-07-api, US-01-08-web                |                                                             |
| EV-AC-07       | US-01-07-api                              |                                                             |
| EV-AC-08       | US-01-07-web                              |                                                             |
| EV-AC-09       | US-01-07-api, US-01-08-web                |                                                             |
| EV-AC-10       | US-01-06-web                              |                                                             |
| EV-AC-11       | US-01-06-api, US-01-06-web                |                                                             |
| EV-AC-12       | US-01-07-api                              |                                                             |
| RESET-AC-01    | US-01-09-api, US-01-09-web                |                                                             |
| RESET-AC-02    | US-01-09-api, US-01-10-api                | issue (09) and consume (10)                                 |
| RESET-AC-03    | US-01-09-api                              |                                                             |
| RESET-AC-04    | US-01-09-api, US-01-09-web                |                                                             |
| RESET-AC-05    | US-01-10-api, US-01-10-web                |                                                             |
| RESET-AC-06…08 | US-01-10-api                              |                                                             |
| RESET-AC-09    | US-01-10-web                              |                                                             |
| RESET-AC-10    | US-01-10-api                              |                                                             |
| RESET-AC-11    | US-01-09-web, US-01-10-web                |                                                             |
| ONB-AC-01      | US-01-03-api, US-01-03-web                |                                                             |
| ONB-AC-02      | US-01-03-api                              |                                                             |
| ONB-AC-03      | US-01-03-web                              |                                                             |
| ONB-AC-04      | US-01-02-web (Skip for Now); **deferred** | Create First Project button ships with the step stories, Q1 |
| ONB-AC-05…06   | US-01-02-web                              |                                                             |
| ONB-AC-07…17   | **deferred**                              | need EPIC-02/03/06 create APIs, Q1                          |
| ONB-AC-18…19   | US-01-02-web (Welcome); **deferred**      | later steps ship with the step stories, Q1                  |
| ONB-AC-20      | US-01-02-web                              |                                                             |
| ONB-AC-21…22   | **deferred**                              | only meaningful once steps can save records, Q1             |
| ONB-AC-23      | US-01-02-web                              |                                                             |
| ONB-AC-24      | **deferred**                              | Q1                                                          |
| ONB-AC-25…28   | **deferred**                              | Dashboard content belongs to EPIC-07, Q2                    |
| ONB-AC-29      | US-01-02-web                              |                                                             |
| UI-AC-01…04    | US-00-03-web                              | used by US-01-01/03/10-web                                  |
| UI-AC-05       | US-00-01-web                              | every web story ships `en` + `uk` keys                      |
| UI-AC-06       | US-00-03-web, US-01-02-web                |                                                             |
| UI-AC-07       | US-01-02-web                              |                                                             |
| UI-AC-08       | **deferred**                              | progress indicator spans the steps, Q1                      |
| GOOG-AC-01     | US-01-11-web                              |                                                             |
| GOOG-AC-02…03  | US-01-11-api                              |                                                             |
| GOOG-AC-04     | US-01-11-api, US-01-11-web                | api signs in; web routes Dashboard / returnTo               |
| GOOG-AC-05…07  | US-01-11-api                              |                                                             |
| GOOG-AC-08     | US-01-11-api, US-01-11-web                | api rejects; web shows the GOOG-07 message                  |
| GOOG-AC-09     | US-01-11-api                              |                                                             |
| GOOG-AC-10     | US-01-11-api, US-01-11-web                |                                                             |
| GOOG-AC-11…12  | US-01-11-api                              | no-password cases of sign-in and reset                      |
| GOOG-08        | **EPIC-09**                               | Change Password hidden, deletion re-auth (FR-010, FR-046)   |

## Open questions

None open. Q1–Q7 were accepted by the human on 2026-11-09 as recommended; Q8 follows D18–D21 (2026-11-10):

- **Q1 — Onboarding steps.** Not in this slice. After EPIC-02/03/06 are sliced, EPIC-01 slice v2
  adds one web story per step (Project, Goal, Weekly Focus), each depending on that epic's create
  API, plus the Welcome "Create First Project" button. Covers ONB-AC-04 (button), 07…22, 24,
  UI-AC-08.
- **Q2 — Dashboard after onboarding.** ONB-AC-25…28 are covered by the EPIC-07 Dashboard slice;
  US-00-04-web ships only a placeholder Dashboard.
- **Q3 — Technical decisions from epic §9.** Settled in CLARIFICATION / API_DESIGN of
  US-01-01-api and US-01-04-api; a session-versioning ADR is approved before the US-01-01-api
  spec is approved.
- **Q4 — Email language.** Emails use the UI locale of the triggering request, `en` fallback
  (US-00-02-api, US-01-06-api, US-01-09-api).
- **Q5 — Language toggle on auth pages.** The EN/УКР toggle is also shown top-right on the auth
  layout (US-00-03-web).
- **Q6 — Email status location.** On `/account` (US-01-08-web); the rest of Account/Settings is
  EPIC-09.
- **Q7 — Profile menu.** Log out only for now; other items arrive with their EPIC-09 pages
  (US-00-04-web).
- **Q8 — Google sign-in (2026-11-10).** Added as US-01-11-api/web after D18–D21; flow per
  ADR-002 (proposed — approve before the US-01-11-api spec). Account-page parts (GOOG-08) belong
  to EPIC-09.

---

## US-00-01-api — Database access and Unit of Work

**As** a backend developer **I want** one Prisma access point and a Unit of Work **so that**
modules can commit cross-module changes in a single PostgreSQL transaction.

- **AC-1** Given the API starts, when it connects, then it uses the `app` schema with
  `app_user` credentials only. _(§6.1, AGENTS.md §3.4)_
- **AC-2** Given a use case that writes in two modules, when it runs inside the Unit of Work,
  then both writes commit together or neither does. _(REG-03, BR-001)_
- **AC-3** Given a write in the Unit of Work fails, then earlier writes in it are rolled back and
  the error reaches the caller. _(REG-AC-10)_

Notes: `infrastructure/database`; modules receive a transaction-scoped port, never the Prisma
client of another module.

## US-00-02-api — Transactional outbox and email delivery

**As** the system **I want** to send emails only after the triggering change commits **so
that** users never get an email for something that was rolled back.

- **AC-1** Given a use case records an outbox event in its Unit of Work, when the transaction
  rolls back, then no event remains and nothing is sent. _(BR-001, §7.10)_
- **AC-2** Given a committed event, then the dispatcher delivers it through the configured SMTP
  provider (Mailpit locally). _(EV-01, D8)_
- **AC-3** Given delivery fails, then it is retried with backoff and an event is never sent twice
  after it was marked delivered. _(§7.10)_
- **AC-4** Given any delivery attempt, then logs contain the event ID and status but no token,
  link or password. _(NFR-004)_

Notes: `infrastructure/outbox`, `infrastructure/email`; event handlers live in the owning modules.
The event carries the request locale; templates exist in `en` and `uk`, `en` fallback (Q4).

## US-00-01-web — Localization setup

**As** a user **I want** the interface in English or Ukrainian **so that** I can work in my
language.

- **AC-1** Given a first visit, then the UI is in English. _(UI-AC-05)_
- **AC-2** Given I choose **УКР** in the language toggle, then all externalized strings switch to
  `uk` and the choice is kept for my next visit in this browser. _(UI-AC-05, A4)_
- **AC-3** Given a component renders text, then it comes from `en`/`uk` message files; a missing
  `uk` key falls back to `en`. _(UI-AC-05)_
- **AC-4** Given the toggle, then it is labelled **EN / УКР**, is keyboard-operable and marks the
  active language without relying on color. _(NFR-005)_

Notes: i18n library chosen in IMPLEMENTATION_PLANNING; per-account language persistence is
EPIC-09 (FR-009).

## US-00-02-web — BFF session store and cookie

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

## US-00-03-web — Auth layout and form fields

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

Notes: the EN/УКР toggle from US-00-01-web sits top-right on this layout (Q5).

UI: `epic-01-auth/login-page.png`, `create-account.png` (frame only). Strings: `en` + `uk`.

## US-00-04-web — App shell

**As** a signed-in user **I want** a consistent header and sidebar **so that** I can move around
the app.

- **AC-1** Given a protected page, then the header shows the logo, the EN/УКР toggle and a
  profile button (initials + full name). _(D17, FR-045)_
- **AC-2** Given the sidebar, then it lists Dashboard, Projects, Goals, Contributions, Weekly
  Focus, Reflection, then a Workspace group with Settings and Account, and can be collapsed.
  _(D17)_
- **AC-3** Given I open the profile button, then a keyboard-operable menu shows Log out; other
  items are added by the stories that own their pages (Q7). _(UF-04, NFR-005)_
- **AC-4** Given `/dashboard`, then a placeholder page renders inside the shell. _(Q2)_

UI: `general/alignment-dashboard.png`, `general/alignment-dashboard-profile-menu.png` (only valid
shell). Log out wiring: US-01-05-web. Strings: `en` + `uk`.

## US-01-01-api — Sign in with email and password

**As** a registered user **I want** to sign in **so that** I can reach my workspace.

- **AC-1** Given a correct email (any case) and password, then session credentials are issued,
  also when the email is unverified; no strength check is applied. _(LOGIN-AC-08, PWD-02)_
- **AC-2** Given an unknown email or a wrong password, then the response is identical: "Invalid
  email or password". _(LOGIN-AC-02, BR-005)_
- **AC-3** Given a successful sign-in, then every earlier session of that user is rejected on its
  next use, on any device. _(LOGIN-AC-07, SES-AC-11, BR-003)_
- **AC-4** Given repeated failures for one account or IP, then responses slow down progressively
  and are rate-limited with a retry hint. _(LOGIN-AC-05, NFR-008)_
- **AC-5** Given any number of failures, then the account is never locked permanently.
  _(LOGIN-AC-06)_

Notes: module `identity`; generation/versioning per the session ADR (Q3). Thresholds decided in
CLARIFICATION.

## US-01-01-web — Sign-in page

**As** a visitor **I want** a sign-in page **so that** I can get into the app.

- **AC-1** Given `/login`, then I see Email, Password, Sign In, Forgot Password and a link to
  registration; no Remember Me. _(LOGIN-AC-01, UI-02)_
- **AC-2** Given valid credentials, then a BFF session is created and I land on `/dashboard`.
  _(LOGIN-AC-03)_
- **AC-3** Given invalid credentials, then "Invalid email or password" is shown and the email
  stays filled. _(LOGIN-AC-02, 04)_
- **AC-4** Given the API rate-limits me, then a retry message is shown without a fixed timer
  value. _(UI-02)_
- **AC-5** Given the request runs, then Sign In shows loading and cannot be sent twice.
  _(LOGIN-AC-04)_

UI: `epic-01-auth/login-page.png`, `sign-in-states.png`. Strings: `en` + `uk`.

## US-01-02-web — Welcome screen

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
"Create First Project" ships with the onboarding steps (Q1). Strings: `en` + `uk`.

## US-01-03-api — Register an account

**As** a visitor **I want** to create an account **so that** I get my own workspace and am
signed in.

- **AC-1** Given valid Full Name, email, password, confirmation and consent, then User
  (Unverified, browser timezone or UTC), personal Workspace, OWNER Membership and a
  `UserRegistered` outbox event are committed in one transaction, and session credentials are
  returned. _(REG-AC-07, 09, ONB-AC-01, 02, REG-05)_
- **AC-2** Given an email already registered in any letter case, then the response says "This
  email is already registered" and nothing is created. _(REG-AC-03, 04, BR-005)_
- **AC-3** Given an invalid field (name 2–100 trimmed, email syntax, password policy, mismatched
  confirmation, missing consent), then field errors are returned and nothing is created.
  _(REG-AC-02, 05, 06, BR-002, BR-006)_
- **AC-4** Given any failure inside the transaction, then no user, workspace or membership
  remains. _(REG-AC-10)_
- **AC-5** Given a stored account, then the password exists only as an adaptive hash.
  _(§7.2)_

Notes: small-story exception — spans `workflows/registration`, `identity` and `workspaces`
because provisioning must be one Unit of Work (BR-001, AGENTS.md §3.9). Password-validator parity
cases (Unicode, 128 chars) are part of the contract tests (§7.11).

## US-01-03-web — Registration page

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

## US-01-04-api — Session refresh and lifetime

**As** the system **I want** to rotate and expire session credentials **so that** stolen or old
sessions stop working.

- **AC-1** Given a valid refresh credential, then new credentials are issued and the old refresh
  credential is rejected afterwards. _(SES-AC-03)_
- **AC-2** Given 30 days since the session was created, then refresh and protected calls are
  rejected, whatever the rotation history. _(SES-AC-01, 03)_
- **AC-3** Given 7 days without qualifying activity, then the session is rejected. _(SES-AC-02)_
- **AC-4** Given a revoked or replaced session, then every protected API call is rejected.
  _(SES-AC-08)_

Notes: module `identity`; "qualifying activity" defined in CLARIFICATION (Q3).

## US-01-04-web — Session Expired and recovery

**As** a user whose session ended **I want** to be told and to sign in again **so that** I can
continue where I was.

- **AC-1** Given the BFF access credential expires, then it is refreshed transparently.
  _(SES-05)_
- **AC-2** Given the session is expired, revoked or replaced, when I use a protected page or BFF
  route, then access is denied and **Session Expired** is shown without any Dashboard link.
  _(SES-AC-08, 09, 11)_
- **AC-3** Given I sign in from Session Expired, then I return to my previous internal page if it
  is still allowed, else `/dashboard`. _(SES-AC-10, LOGIN-02)_
- **AC-4** Given a return URL that is external, protocol-relative or malformed, then it is
  ignored and I land on `/dashboard`. _(SES-AC-10, §6.4)_
- **AC-5** Given reauthentication runs, then the form shows loading and blocks repeats. _(UI-03)_

UI: `epic-01-auth/session-management-flow.png`. Strings: `en` + `uk`.

## US-01-05-api — Sign out

**As** a user **I want** signing out to end my session on the server **so that** nobody can reuse it.

- **AC-1** Given a signed-in session, when sign-out is requested, then its credentials are
  revoked. _(SES-AC-05)_
- **AC-2** Given revoked credentials, then any later refresh or protected call is rejected.
  _(SES-AC-05, §6.3)_

Notes: module `identity`.

## US-01-05-web — Log out from the profile menu

**As** a user **I want** to log out from the profile menu **so that** my account is safe on this
browser.

- **AC-1** Given I choose Log out in the profile menu, then the BFF session and its credentials
  are revoked. _(SES-AC-05, UF-04, FR-045)_
- **AC-2** Given log out finishes, then Login shows "You have been signed out". _(SES-AC-07)_
- **AC-3** Given other open tabs, then they show the signed-out state. _(SES-AC-06)_
- **AC-4** Given a tab did not get the notice, then its next protected request is still denied.
  _(SES-AC-06, §7.7)_

UI: `general/alignment-dashboard-profile-menu.png`. Strings: `en` + `uk`.

## US-01-06-api — Verify email

**As** a new user **I want** to confirm my email **so that** my account is marked verified.

- **AC-1** Given a `UserRegistered` event, then a verification email with a 24-hour one-time link
  is sent after commit; only the token hash is stored. _(EV-AC-01, 03, EV-02)_
- **AC-2** Given a token check (read-only), then the token is not consumed. _(EV-AC-04)_
- **AC-3** Given a valid token, when verification is submitted (POST), then the email becomes
  Verified once and the token is consumed. _(EV-AC-04, 05)_
- **AC-4** Given an expired, used or unknown token, then the result is a neutral state that does
  not reveal account data. _(EV-AC-11, EV-06)_
- **AC-5** Given a token at or after `expiresAt`, then it is rejected. _(EV-AC-03)_

Notes: module `identity`; email template content per UI-14 (CTA, 24-hour note, fallback URL,
security note).

## US-01-06-web — Verify email pages

**As** a user who got the email **I want** a clear verify page **so that** I confirm on purpose.

- **AC-1** Given I open the link, then **Verify Your Email** shows a Verify Email button and
  nothing changes yet. _(EV-AC-04, UI-10)_
- **AC-2** Given I press Verify Email, then the result shows exactly one CTA: **Continue to App**
  with an active session, otherwise **Go to Login**. _(EV-AC-10)_
- **AC-3** Given an expired, invalid or used link, then a safe state explains how to get a new
  link after signing in. _(EV-AC-11, EV-07)_
- **AC-4** Given the verify page, then the token is not leaked via referrer or third-party
  assets. _(§7.8)_

UI: `epic-01-auth/email-verification.png`. Strings: `en` + `uk`.

## US-01-07-api — Verification status and resend

**As** a signed-in user **I want** to see whether my email is verified and get a new link
**so that** I can finish verification later.

- **AC-1** Given a signed-in user, then their email and verification status can be read.
  _(EV-AC-09)_
- **AC-2** Given an unverified user, then no API rejects them for being unverified.
  _(EV-AC-02, LOGIN-03)_
- **AC-3** Given a resend less than 60 s after the last one, then it is refused with the time
  left; repeated resends are rate-limited. _(EV-AC-06, NFR-008)_
- **AC-4** Given a resend is accepted, then earlier unused tokens stop working. _(EV-AC-07)_
- **AC-5** Given no authenticated session (e.g. only an old link), then resend is refused.
  _(EV-AC-12)_

Notes: module `identity`.

## US-01-07-web — Unverified banner on Dashboard

**As** an unverified user **I want** a gentle reminder **so that** I remember to verify.

- **AC-1** Given my email is unverified, then the Dashboard shows a non-intrusive banner.
  _(EV-AC-08, UI-12)_
- **AC-2** Given I dismiss it, then it stays hidden until this session ends. _(EV-AC-08)_
- **AC-3** Given my email is verified, then no banner is shown. _(EV-05)_

UI: `epic-01-auth/email-verification.png` (banner panel). Strings: `en` + `uk`.

## US-01-08-web — Email status in Account settings

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
Account is EPIC-09 (Q6). Strings: `en` + `uk`.

## US-01-09-api — Request a password reset

**As** a user who forgot the password **I want** a reset link **so that** I can regain access.

- **AC-1** Given any email, then the response is the same whether the account exists or not.
  _(RESET-AC-01, BR-005)_
- **AC-2** Given an existing account, then a reset email with a 30-minute one-time link is sent
  after commit; only the token hash is stored. _(RESET-AC-02)_
- **AC-3** Given a new request, then earlier unused reset tokens stop working. _(RESET-AC-03)_
- **AC-4** Given a request within 60 s of the last one, then no new email is sent; requests are
  rate-limited, still with a neutral response. _(RESET-AC-04, NFR-008)_
- **AC-5** Given a token check (read-only), then it reports valid / invalid without consuming it.
  _(RESET-AC-11 support)_

Notes: module `identity`.

## US-01-09-web — Forgot password and Check your inbox

**As** a user **I want** to request a reset link **so that** I can set a new password.

- **AC-1** Given `/forgot-password`, when I submit an email, then **Check Your Inbox** shows the
  same text for any email. _(RESET-AC-01, UI-06, UI-07)_
- **AC-2** Given an invalid email format, then an inline error is shown and the value is kept.
  _(RESET-AC-11, UI-06)_
- **AC-3** Given Check Your Inbox, then Resend is disabled for 60 s, then shows loading and
  errors. _(RESET-AC-04, UI-07)_
- **AC-4** Given a server error, then a retry message is shown. _(RESET-AC-11)_

UI: `epic-01-auth/forgot-password-states.png`. Strings: `en` + `uk`.

## US-01-10-api — Reset the password

**As** a user with a reset link **I want** to set a new password **so that** I can sign in again.

- **AC-1** Given a valid token and a password meeting BR-002 (the current one is allowed), then
  the password changes and the token is consumed in one transaction. _(RESET-AC-05…07)_
- **AC-2** Given success, then all sessions and refresh credentials of the user are revoked on
  every device. _(RESET-AC-08, SES-AC-12)_
- **AC-3** Given an expired (≥ 30 min), used or unknown token, then nothing changes.
  _(RESET-AC-02, 10)_
- **AC-4** Given two concurrent submissions with one token, then only one succeeds.
  _(RESET-AC-07, NFR-003)_
- **AC-5** Given success, then no session credentials are returned. _(RESET-03)_

Notes: module `identity`.

## US-01-10-web — Reset password form and result

**As** a user **I want** a reset form with clear results **so that** I know what to do next.

- **AC-1** Given a valid link, then the form shows New and Confirm Password with Show/Hide and the
  policy checklist, mirroring BR-002. _(RESET-AC-05, UI-08)_
- **AC-2** Given success, then I land on Login with a success message and am not signed in.
  _(RESET-AC-09, UI-09)_
- **AC-3** Given an expired, invalid or used link, then a safe state offers a new reset request.
  _(RESET-AC-11, UI-09)_
- **AC-4** Given submission, then loading blocks duplicates and validation errors are inline.
  _(RESET-AC-11)_

UI: `epic-01-auth/password-reset-states.png`. Strings: `en` + `uk`.

## US-01-11-api — Continue with Google

**As** a visitor **I want** to register or sign in with my Google account **so that** I don't
need a separate password.

- **AC-1** Given a valid code for an unknown Google identity with `email_verified`, then User
  (Verified, no password, name per A10, browser timezone), Workspace, OWNER Membership, Google
  identity and a `UserRegistered` event (`emailVerified: true`, no verification email) are
  committed in one transaction, and credentials with `isNewAccount: true` are returned.
  _(GOOG-AC-02, 03, BR-001)_
- **AC-2** Given a known Google `sub`, then credentials are returned, all earlier sessions are
  revoked, and a changed Google email creates nothing new. _(GOOG-AC-04, 07, 09)_
- **AC-3** Given a verified Google email that matches an account, then Google is linked, the
  email becomes Verified and pending verification tokens stop working; if the account was
  Unverified, its password is removed and its sessions are revoked first. _(GOOG-AC-05, 06)_
- **AC-4** Given an invalid code, an ID token failing signature/`iss`/`aud`/`exp`/`nonce`, or
  `email_verified = false`, then nothing is created or linked and one generic error is
  returned; Google tokens are neither stored nor logged. _(GOOG-AC-08, 10)_
- **AC-5** Given a Google-only account, then email/password sign-in returns "Invalid email or
  password", and a password reset sets its first password while Google stays linked.
  _(GOOG-AC-11, 12, D20)_

Notes: modules `identity` + `workflows/registration`; data and flow per ADR-002 (nullable
`password_hash`, `external_identities`). Rate limiting reuses US-01-01-api. Test with a fake OIDC
provider. Google Cloud OAuth client must exist (owner: user).

## US-01-11-web — Continue with Google buttons and flow

**As** a visitor **I want** a Continue with Google button **so that** I can sign up or sign in in
one click.

- **AC-1** Given `/login`, `/register` or Session Expired, then **Continue with Google** is shown
  at the top, above an "or" divider and the email form; `/register` also shows "By continuing with Google, you agree to the
  Terms of Service and Privacy Policy". _(GOOG-AC-01, UI-01…03)_
- **AC-2** Given I press it, then the button shows loading, and the BFF stores `state`, nonce,
  PKCE verifier, timezone, locale and a validated `returnTo` in a short-lived HttpOnly cookie
  and redirects to Google. _(UI-19, ADR-002)_
- **AC-3** Given Google redirects back with a matching `state`, then a BFF session is created and
  I land on `/welcome` (new account), `/dashboard`, or the revalidated `returnTo` after Session
  Expired. _(GOOG-AC-04, GOOG-06)_
- **AC-4** Given I cancelled, `state` mismatches or the API rejects, then I return to the
  starting page with "Couldn't sign in with Google. Try again or use your email." _(GOOG-AC-08)_
- **AC-5** Given the flow, then the code, ID token and query string never reach client code,
  browser storage or logs. _(GOOG-AC-10, NFR-001)_

UI: `epic-01-auth/google-sign-in-screens.png` with the corrections in the design README (consent
line under the Google button, EN/УКР, D17 shell); button per Google branding guidelines. Strings: `en` + `uk`.
