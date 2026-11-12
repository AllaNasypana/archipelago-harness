---
artifact_type: backlog
epic: EPIC-01
version: 2
status: DRAFT
updated_at: 2026-11-12T11:43:54Z
produced_by: backlog-sync
inputs:
  - { path: docs/epics/EPIC-01_Authentication_and_User_Onboarding.md }
  - { path: docs/product/archipelago-business-requirements.md }
  - { path: docs/design/README.md }
  - { path: docs/adr/ADR-002-google-sign-in.md }
---

# EPIC-01 Authentication and User Onboarding — Backlog

26 stories: 6 foundation (`US-00`, folder `epic-00/`) and 20 epic stories; 11 `api`, 15 `web`;
19 `risk: high`, 7 `normal`. Table order is the delivery order. The onboarding steps
(Project → Goal → Weekly Focus) and the Dashboard states after onboarding are deferred until the
EPIC-02/03/06/07 stories they call exist (D-01-01, D-01-02).

Migrated on 2026-11-11 from the story slice `docs/stories/slices/EPIC-01-slice.md` (v1, 2026-11-10; removed, see Git history); risk was
added in the migration and is a proposal for HUMAN_BACKLOG_APPROVAL.

## Re-slice pending

On 2026-11-12 the human restarted EPIC-01 under the revised harness (stage inputs, `layer_rules`,
ADR-004, PRD, `api-patterns.md` / `web-patterns.md` §10). US-00-01-api and US-00-01-web stay `DONE`
(their agreements now live in those pattern files). Every other story is back to `PROPOSED` and
its `story.md` was removed; `BACKLOG_SYNC` (revise) writes this backlog's next version.

## Stories

| ID                                               | Layer | Title                                   | Depends on   | Risk   | BRD refs                       | Epic refs                                    | ACs | Status   |
| ------------------------------------------------ | ----- | --------------------------------------- | ------------ | ------ | ------------------------------ | -------------------------------------------- | --- | -------- |
| [US-00-01-api](../epic-00/US-00-01-api/story.md) | api   | Database access and Unit of Work        | —            | high   | BR-001, NFR-003                | REG-03, §6.1                                 | 3   | DONE     |
| [US-00-02-api](../epic-00/US-00-02-api/story.md) | api   | Transactional outbox and email delivery | —            | high   | BR-001, NFR-004                | EV-01, UF-01, §7.10                          | 4   | PROPOSED |
| [US-00-01-web](../epic-00/US-00-01-web/story.md) | web   | Localization setup                      | —            | high   | NFR-005                        | UI-AC-05                                     | 4   | DONE     |
| [US-00-02-web](../epic-00/US-00-02-web/story.md) | web   | BFF session store and cookie            | —            | high   | NFR-001, NFR-004               | SES-05, SES-AC-04, §7.1                      | 5   | PROPOSED |
| [US-00-03-web](../epic-00/US-00-03-web/story.md) | web   | Auth layout and form fields             | —            | normal | NFR-005, NFR-007               | UI-AC-01…04, UI-AC-06                        | 5   | PROPOSED |
| [US-00-04-web](../epic-00/US-00-04-web/story.md) | web   | App shell                               | —            | normal | FR-045, NFR-005                | §8 shared visual language, UF-04 step 1      | 4   | PROPOSED |
| [US-01-01-api](US-01-01-api/story.md)            | api   | Sign in with email and password         | —            | high   | FR-002, BR-003, BR-005         | LOGIN-AC-02, 05…08, SES-AC-11                | 5   | PROPOSED |
| [US-01-01-web](US-01-01-web/story.md)            | web   | Sign-in page                            | US-01-01-api | high   | FR-002                         | LOGIN-AC-01…04, UI-02                        | 5   | PROPOSED |
| [US-01-02-web](US-01-02-web/story.md)            | web   | Welcome screen                          | —            | high   | FR-007                         | ONB-AC-04…06, 18…20, 23, 29, UI-AC-07, UI-05 | 4   | PROPOSED |
| [US-01-03-api](US-01-03-api/story.md)            | api   | Register an account                     | —            | high   | FR-001, BR-001, BR-002, BR-006 | REG-AC-02…07, 09, 10, ONB-AC-01, 02          | 5   | PROPOSED |
| [US-01-03-web](US-01-03-web/story.md)            | web   | Registration page                       | US-01-03-api | high   | FR-001                         | REG-AC-01…06, 08…10, ONB-AC-01, 03, UI-01    | 5   | PROPOSED |
| [US-01-04-api](US-01-04-api/story.md)            | api   | Session refresh and lifetime            | —            | high   | FR-003, BR-003                 | SES-AC-01…03, 08                             | 4   | PROPOSED |
| [US-01-04-web](US-01-04-web/story.md)            | web   | Session Expired and recovery            | US-01-04-api | high   | FR-003                         | SES-AC-08…11, UI-03                          | 5   | PROPOSED |
| [US-01-05-api](US-01-05-api/story.md)            | api   | Sign out                                | —            | high   | FR-004                         | SES-AC-05                                    | 2   | PROPOSED |
| [US-01-05-web](US-01-05-web/story.md)            | web   | Log out from the profile menu           | US-01-05-api | high   | FR-004, FR-045                 | SES-AC-05…07, UI-04                          | 4   | PROPOSED |
| [US-01-06-api](US-01-06-api/story.md)            | api   | Verify email                            | —            | high   | FR-005, BR-004                 | EV-AC-01, 03…05, 11                          | 5   | PROPOSED |
| [US-01-06-web](US-01-06-web/story.md)            | web   | Verify email pages                      | US-01-06-api | high   | FR-005                         | EV-AC-04, 10, 11, UI-10, UI-11               | 4   | PROPOSED |
| [US-01-07-api](US-01-07-api/story.md)            | api   | Verification status and resend          | —            | high   | FR-005, BR-004, NFR-008        | EV-AC-02, 06, 07, 09, 12                     | 5   | PROPOSED |
| [US-01-07-web](US-01-07-web/story.md)            | web   | Unverified banner on Dashboard          | US-01-07-api | normal | FR-005                         | EV-AC-08, UI-12                              | 3   | PROPOSED |
| [US-01-08-web](US-01-08-web/story.md)            | web   | Email status in Account settings        | US-01-07-api | normal | FR-005, FR-008                 | EV-AC-06, 09, UI-13                          | 4   | PROPOSED |
| [US-01-09-api](US-01-09-api/story.md)            | api   | Request a password reset                | —            | high   | FR-006, BR-004, BR-005         | RESET-AC-01…04                               | 5   | PROPOSED |
| [US-01-09-web](US-01-09-web/story.md)            | web   | Forgot password and Check your inbox    | US-01-09-api | normal | FR-006                         | RESET-AC-01, 04, 11, UI-06, UI-07            | 4   | PROPOSED |
| [US-01-10-api](US-01-10-api/story.md)            | api   | Reset the password                      | —            | high   | FR-006, BR-002, BR-003         | RESET-AC-02, 05…08, 10, SES-AC-12            | 5   | PROPOSED |
| [US-01-10-web](US-01-10-web/story.md)            | web   | Reset password form and result          | US-01-10-api | normal | FR-006                         | RESET-AC-05, 09, 11, UI-08, UI-09            | 4   | PROPOSED |
| [US-01-11-api](US-01-11-api/story.md)            | api   | Continue with Google                    | —            | high   | FR-047, BR-033, BR-001, BR-003 | GOOG-AC-02…12                                | 5   | PROPOSED |
| [US-01-11-web](US-01-11-web/story.md)            | web   | Continue with Google buttons and flow   | US-01-11-api | high   | FR-047                         | GOOG-AC-01, 04, 08, 10, UI-19                | 5   | PROPOSED |

`depends_on` names the one api story whose contract a web story consumes. Web stories with `—`
have no API contract (pure UI or BFF plumbing). Api stories have no `depends_on`: the table order
is the delivery order and only one story is active at a time. Sign in comes before Register so
credential issuance exists when registration signs the user in (REG-04). Google (US-01-11) comes
last: it reuses sign-in, registration, session and reset, and needs ADR-002 approved.

## Coverage

| Epic AC        | Covered by                                | Note                                                             |
| -------------- | ----------------------------------------- | ---------------------------------------------------------------- |
| REG-AC-01      | US-01-03-web                              |                                                                  |
| REG-AC-02…06   | US-01-03-api, US-01-03-web                | api authoritative; web mirrors (BR-002 parity)                   |
| REG-AC-07      | US-01-03-api, US-00-01-api                |                                                                  |
| REG-AC-08      | US-01-03-web, US-00-02-web                |                                                                  |
| REG-AC-09      | US-01-03-api, US-01-03-web                |                                                                  |
| REG-AC-10      | US-01-03-api, US-01-03-web                | api: no partial data; web: post-commit failure → Login           |
| LOGIN-AC-01    | US-01-01-web                              |                                                                  |
| LOGIN-AC-02    | US-01-01-api, US-01-01-web                |                                                                  |
| LOGIN-AC-03…04 | US-01-01-web                              |                                                                  |
| LOGIN-AC-05…08 | US-01-01-api                              |                                                                  |
| SES-AC-01…03   | US-01-04-api                              |                                                                  |
| SES-AC-04      | US-00-02-web                              |                                                                  |
| SES-AC-05      | US-01-05-api, US-01-05-web                |                                                                  |
| SES-AC-06…07   | US-01-05-web                              |                                                                  |
| SES-AC-08      | US-01-04-api, US-01-04-web                |                                                                  |
| SES-AC-09…10   | US-01-04-web                              |                                                                  |
| SES-AC-11      | US-01-01-api, US-01-04-web                | api revokes; web shows the replaced-session state                |
| SES-AC-12      | US-01-10-api                              |                                                                  |
| EV-AC-01       | US-01-06-api, US-00-02-api                |                                                                  |
| EV-AC-02       | US-01-07-api                              | no verification guard anywhere; asserted on sign-in too          |
| EV-AC-03       | US-01-06-api                              |                                                                  |
| EV-AC-04       | US-01-06-api, US-01-06-web                |                                                                  |
| EV-AC-05       | US-01-06-api                              |                                                                  |
| EV-AC-06       | US-01-07-api, US-01-08-web                |                                                                  |
| EV-AC-07       | US-01-07-api                              |                                                                  |
| EV-AC-08       | US-01-07-web                              |                                                                  |
| EV-AC-09       | US-01-07-api, US-01-08-web                |                                                                  |
| EV-AC-10       | US-01-06-web                              |                                                                  |
| EV-AC-11       | US-01-06-api, US-01-06-web                |                                                                  |
| EV-AC-12       | US-01-07-api                              |                                                                  |
| RESET-AC-01    | US-01-09-api, US-01-09-web                |                                                                  |
| RESET-AC-02    | US-01-09-api, US-01-10-api                | issue (09) and consume (10)                                      |
| RESET-AC-03    | US-01-09-api                              |                                                                  |
| RESET-AC-04    | US-01-09-api, US-01-09-web                |                                                                  |
| RESET-AC-05    | US-01-10-api, US-01-10-web                |                                                                  |
| RESET-AC-06…08 | US-01-10-api                              |                                                                  |
| RESET-AC-09    | US-01-10-web                              |                                                                  |
| RESET-AC-10    | US-01-10-api                              |                                                                  |
| RESET-AC-11    | US-01-09-web, US-01-10-web                |                                                                  |
| ONB-AC-01      | US-01-03-api, US-01-03-web                |                                                                  |
| ONB-AC-02      | US-01-03-api                              |                                                                  |
| ONB-AC-03      | US-01-03-web                              |                                                                  |
| ONB-AC-04      | US-01-02-web (Skip for Now); **deferred** | Create First Project button ships with the step stories, D-01-01 |
| ONB-AC-05…06   | US-01-02-web                              |                                                                  |
| ONB-AC-07…17   | **deferred**                              | need EPIC-02/03/06 create APIs, D-01-01                          |
| ONB-AC-18…19   | US-01-02-web (Welcome); **deferred**      | later steps ship with the step stories, D-01-01                  |
| ONB-AC-20      | US-01-02-web                              |                                                                  |
| ONB-AC-21…22   | **deferred**                              | only meaningful once steps can save records, D-01-01             |
| ONB-AC-23      | US-01-02-web                              |                                                                  |
| ONB-AC-24      | **deferred**                              | D-01-01                                                          |
| ONB-AC-25…28   | **deferred**                              | Dashboard content belongs to EPIC-07, D-01-02                    |
| ONB-AC-29      | US-01-02-web                              |                                                                  |
| UI-AC-01…04    | US-00-03-web                              | used by US-01-01/03/10-web                                       |
| UI-AC-05       | US-00-01-web                              | every web story ships `en` + `uk` keys                           |
| UI-AC-06       | US-00-03-web, US-01-02-web                |                                                                  |
| UI-AC-07       | US-01-02-web                              |                                                                  |
| UI-AC-08       | **deferred**                              | progress indicator spans the steps, D-01-01                      |
| GOOG-AC-01     | US-01-11-web                              |                                                                  |
| GOOG-AC-02…03  | US-01-11-api                              |                                                                  |
| GOOG-AC-04     | US-01-11-api, US-01-11-web                | api signs in; web routes Dashboard / returnTo                    |
| GOOG-AC-05…07  | US-01-11-api                              |                                                                  |
| GOOG-AC-08     | US-01-11-api, US-01-11-web                | api rejects; web shows the GOOG-07 message                       |
| GOOG-AC-09     | US-01-11-api                              |                                                                  |
| GOOG-AC-10     | US-01-11-api, US-01-11-web                |                                                                  |
| GOOG-AC-11…12  | US-01-11-api                              | no-password cases of sign-in and reset                           |
| GOOG-08        | **EPIC-09**                               | Change Password hidden, deletion re-auth (FR-010, FR-046)        |

## Open questions

None open. Settled questions are in [decisions.md](decisions.md) (D-01-01…D-01-08).
