# Design — Desktop Mockups

Approved desktop mockups for the MVP, grouped by epic. Light theme, white/gray surfaces with an
orange accent, Grafana-inspired compact layout.

**Mockups are visual references, not requirements.** When a mockup disagrees with an epic
specification, the BRD or the PRD, the written document wins. Each epic lists its approved
design corrections; sample names, numbers, dates, IDs and domains in mockups are illustrative.

Originals are archived unchanged in `start/docs/input/` (outside this repo); the "Source" column
gives the original filename so the trace back is unambiguous.

## App shell — the only correct layout

The header and left sidebar are correct **only** in these two mockups. Headers and sidebars in
every other mockup (e.g. "Home" item, user block at the sidebar bottom, no top header, different
order) are wrong: use those mockups for the **page content area only**.

| Reference                                                                                    | Shows                                                          |
| -------------------------------------------------------------------------------------------- | -------------------------------------------------------------- |
| [alignment-dashboard.png](mockups/general/alignment-dashboard.png)                           | Full app shell                                                 |
| [alignment-dashboard-profile-menu.png](mockups/general/alignment-dashboard-profile-menu.png) | Profile dropdown with **Log out** (EPIC-01 UF-04 / BRD FR-004) |

- **Header:** logo (left); language toggle and profile button (avatar initials + full name + chevron) on the right.
  The toggle is labelled **EN / УКР**, not "EN / UK" as drawn (BRD A4).
- **Profile dropdown:** name + "Personal Workspace"; Account Settings, Security, Email, Preferences; **Log out** (the only logout entry point).
- **Sidebar:** Dashboard, Projects, Goals, Contributions, Weekly Focus, Reflection; a **Workspace** group with Settings and Account;
  Collapse control at the bottom.
- Auth pages and Welcome/onboarding have no sidebar (EPIC-01 UI-AC-06).

Decision: BRD Q19 / D17 (FR-045, A9).

## Naming

`docs/design/mockups/<epic-folder>/<screen-or-set>.png`, kebab-case, no spaces.
Multi-screen boards whose header says "Set N/4" keep that number as `-set-N`.

## General

| File                                                                                         | Source                                     | Notes                                                                 |
| -------------------------------------------------------------------------------------------- | ------------------------------------------ | --------------------------------------------------------------------- |
| [alignment-dashboard.png](mockups/general/alignment-dashboard.png)                           | `Archipelago Alignment Dashboard.png`      | **App-shell reference.** Page content: EPIC-07 sets are authoritative |
| [alignment-dashboard-profile-menu.png](mockups/general/alignment-dashboard-profile-menu.png) | `Alignment Dashboard Profile Menu.png`     | **App-shell reference** — profile dropdown with Log out               |
| [workspace-welcome-screen.png](mockups/general/workspace-welcome-screen.png)                 | `Archipelago Workspace Welcome Screen.png` | **Superseded** — Welcome has no sidebar (EPIC-01 UI-05, C11)          |

## EPIC-01 — Authentication & Onboarding

Spec: [EPIC-01](../epics/EPIC-01_Authentication_and_User_Onboarding.md) §8 (mockup inventory UI-01…).

| File                                                                              | Source                                                                                                       |
| --------------------------------------------------------------------------------- | ------------------------------------------------------------------------------------------------------------ |
| [login-page.png](mockups/epic-01-auth/login-page.png)                             | `Archipelago SaaS Login Page.png`                                                                            |
| [sign-in-welcome.png](mockups/epic-01-auth/sign-in-welcome.png)                   | `Archipelago Sign-In Welcome Screen.png`                                                                     |
| [sign-in-states.png](mockups/epic-01-auth/sign-in-states.png)                     | `Archipelago Sign-In States UI Mockup.png`                                                                   |
| [create-account.png](mockups/epic-01-auth/create-account.png)                     | `Archipelago Create Account UI Mockup.png`                                                                   |
| [registration-states.png](mockups/epic-01-auth/registration-states.png)           | `Archipelago Registration States Mockup.png`                                                                 |
| [email-verification.png](mockups/epic-01-auth/email-verification.png)             | `Archipelago Email Verification UI Board.png`                                                                |
| [forgot-password-states.png](mockups/epic-01-auth/forgot-password-states.png)     | `Archipelago Forgot Password States-1.png`                                                                   |
| [password-reset-states.png](mockups/epic-01-auth/password-reset-states.png)       | `Archipelago Password Reset States(1).png`                                                                   |
| [session-management-flow.png](mockups/epic-01-auth/session-management-flow.png)   | `Archipelago Session Management Flow.png` (identical copy `… Flow (1).png` dropped)                          |
| [onboarding-journey.png](mockups/epic-01-auth/onboarding-journey.png)             | `Archipelago Onboarding Dashboard Journey.png` — "up to 3" focus goals is **not approved** (ONB-05: 1–5)     |
| [account-settings-profile.png](mockups/epic-01-auth/account-settings-profile.png) | `Archipelago Account Settings Profile Dashboard.png` — no avatar in MVP (D5)                                 |
| [google-sign-in-screens.png](mockups/epic-01-auth/google-sign-in-screens.png)     | `Archipelago EPIC-01 Workflow Screens.png` — **reference** for Continue with Google (UI-01…03, UI-19, UI-20) |
| [google-sign-in-flow.png](mockups/epic-01-auth/google-sign-in-flow.png)           | `Archipelago Google Sign-In UX Flow.png` — **superseded** by the board above, except the corrections below   |

### Continue with Google — corrections (D18–D21, 2026-11-10)

Both boards show the same 8 states: Login, Create Account, Session Expired, Redirecting, Google error on Login and on
Register, Account (Google-only), Delete Account re-auth. `google-sign-in-screens.png` is the reference because it keeps the
explicit consent checkbox for the email form (REG-01) and the language toggle on auth pages (slice Q5).

- **Layout (owner-confirmed 2026-11-10):** Continue with Google sits at the top, above the "or" divider and the email form on Login, Create Account and Session
  Expired. On Session Expired, the email path is labelled **Log in with Email**.
- **Consent on Create Account (D19):** add the line from `google-sign-in-flow.png` under the Google button, worded for
  Google: "By continuing with Google, you agree to the Terms of Service and Privacy Policy." The email form keeps its own
  checkbox. The flow board's single line "By creating an account, you agree…" without a checkbox is **not approved**: it
  would drop explicit consent for email registration.
- **Redirecting:** the title "Signing in with Google…" and the disabled button with a spinner are the reference.
- **Google errors:** the alert text is "Couldn't sign in with Google. Try again or use your email." (GOOG-07), and the alert
  can be dismissed (×). Entered email-form values are kept.
- **Session Expired copy:** the text depends on the reason. Inactivity or the 30-day limit is drawn; also add "signed in on
  another device" for a replaced session (UI-03, SES-01).
- **Account (Google-only):** the "Account Access — Signed in with Google · Active" card is the reference, with no Change
  Password (GOOG-08). Email is read-only. **Timezone belongs on Settings, not Account** (A9), so drop the row drawn here.
  Users with both a password and Google show Change Password as well.
- **Delete Account:** the modal asks for Continue with Google or Cancel and names the deleted data (FR-046, D21). Users with
  a password re-enter it instead.
- **App shell:** on both boards it is not authoritative. Use D17: sidebar Dashboard … Reflection plus a Workspace group with
  Settings and Account. The toggle label is **EN / УКР** (A4), not "EN UK".
- **Google button:** follows Google's sign-in branding guidelines (official "G" logo, white button, "Continue with Google"),
  not the orange accent.

## EPIC-02 — Projects

Spec: [EPIC-02](../epics/EPIC-02_Projects_Management.md) (mockup table + approved design corrections).

| File                                                                        | Source                                           |
| --------------------------------------------------------------------------- | ------------------------------------------------ |
| [projects-management.png](mockups/epic-02-projects/projects-management.png) | `Archipelago Projects Management UI Collage.png` |

## EPIC-03 — Goals

Spec: [EPIC-03](../epics/EPIC-03_Goals_Management.md) (design direction + corrections, incl. C13).

| File                                                                                       | Source                                                                           |
| ------------------------------------------------------------------------------------------ | -------------------------------------------------------------------------------- |
| [goals-management-board.png](mockups/epic-03-goals/goals-management-board.png)             | `Archipelago Goals Management Board.png` (overview board)                        |
| [goals-list.png](mockups/epic-03-goals/goals-list.png)                                     | `Archipelago Goals Dashboard.png` (identical copy `… Dashboard-1.png` dropped)   |
| [create-goal.png](mockups/epic-03-goals/create-goal.png)                                   | `Archipelago Create Goal Dashboard.png`                                          |
| [edit-goal.png](mockups/epic-03-goals/edit-goal.png)                                       | `Archipelago Edit Goal Dashboard.png`                                            |
| [goal-completion-confirmation.png](mockups/epic-03-goals/goal-completion-confirmation.png) | `Goal Completion Confirmation Dashboard-2.png`                                   |
| [completed-goal.png](mockups/epic-03-goals/completed-goal.png)                             | `Completed Goal Dashboard.png`                                                   |
| [goal-reopened.png](mockups/epic-03-goals/goal-reopened.png)                               | `Archipelago Goal Reopened Dashboard.png`                                        |
| [goal-archive-confirmation.png](mockups/epic-03-goals/goal-archive-confirmation.png)       | `Archipelago Goal Archive Confirmation.png`                                      |
| [archived-goal.png](mockups/epic-03-goals/archived-goal.png)                               | `Archipelago Archived Goal Dashboard.png` — text "…in Reflection" is wrong (C13) |

## EPIC-04 — Contributions

Spec: [EPIC-04](../epics/EPIC-04_Contributions_Management.md).

| File                                                                                       | Source                                                                                                                                                                                                                                                                                                                                                                                                                                                             |
| ------------------------------------------------------------------------------------------ | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| [contributions-management.png](mockups/epic-04-contributions/contributions-management.png) | `Archipelago Contributions Management Mockups.png` — delete-dialog copy about Progress Events is corrected in spec                                                                                                                                                                                                                                                                                                                                                 |
| [contributions-workflow.png](mockups/epic-04-contributions/contributions-workflow.png)     | `epic-05/Archipelago Contribution Workflow UI Mockup.png` (filed under epic-05, but it is EPIC-04 content) — correct app shell. Panel numbers 5–8 do not match the EPIC-04 inventory: they illustrate Edit (10), Delete confirmation (13), late Contribution in an unfinalized past week, and the Archived Goal restriction (15). Create/Edit are dialogs per spec, not pages; the archived restriction must offer **Restore Goal/Project**, not only "Go to Goal" |

## EPIC-05 — Progress Tracking

Spec: [EPIC-05](../epics/EPIC-05_Progress_Tracking.md) §9 (screen inventory 01–16).

| File                                                                                | Source                                            | Screens                                                                                                              |
| ----------------------------------------------------------------------------------- | ------------------------------------------------- | -------------------------------------------------------------------------------------------------------------------- |
| [progress-tracking-set-1.png](mockups/epic-05-progress/progress-tracking-set-1.png) | `Archipelago Progress Tracking Mockups-start.png` | 1–4                                                                                                                  |
| [progress-tracking-set-2.png](mockups/epic-05-progress/progress-tracking-set-2.png) | `Archipelago Progress Update UI Showcase.png`     | 5–8 — correct app shell. Update Progress is a dialog (02), not a page; Progress History is a section, not a tab (04) |
| [progress-tracking-set-3.png](mockups/epic-05-progress/progress-tracking-set-3.png) | `Archipelago Goal Tracking Mockups.png`           | 9–12                                                                                                                 |
| [progress-tracking-set-4.png](mockups/epic-05-progress/progress-tracking-set-4.png) | `Archipelago Progress Tracking Mockups.png`       | 13–16                                                                                                                |

**Not used:** `Archipelago Goal Progress UI Set.png` (an alternative 5–8) — its "Complete Goal (can be < 100%)" contradicts PRG rules (completion requires 100% + explicit confirmation), and it shows Progress History as a tab.

## EPIC-06 — Weekly Focus Planning

Spec: [EPIC-06](../epics/EPIC-06_Weekly_Focus_Planning.md) §9 (screen inventory 01–16).

| File                                                                          | Source                                                            |
| ----------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [weekly-focus-set-1.png](mockups/epic-06-weekly-focus/weekly-focus-set-1.png) | `Weekly Focus Planning Dashboard.png`                             |
| [weekly-focus-set-2.png](mockups/epic-06-weekly-focus/weekly-focus-set-2.png) | `Weekly Focus Planning Desktop Mockups.png`                       |
| [weekly-focus-set-3.png](mockups/epic-06-weekly-focus/weekly-focus-set-3.png) | `Archipelago Weekly Focus UI Screens.png` — **see warning below** |
| [weekly-focus-set-4.png](mockups/epic-06-weekly-focus/weekly-focus-set-4.png) | `Archipelago Weekly Focus Planning Mockups.png`                   |

**Set 3 does not match the approved inventory 09–12.** Its app shell is correct (except the
"EN / UK" label → EN / УКР), but the drawn screens differ from EPIC-06 §9.
**Decision (2026-11-09): screen 09 may be used as a visual reference; screens 10–12 are built from the
EPIC-06 text only — ignore the drawn 10–12 panels entirely.**

| #   | Approved (EPIC-06 §9)                                            | Drawn in set 3                                      | Problem                                                                                                  |
| --- | ---------------------------------------------------------------- | --------------------------------------------------- | -------------------------------------------------------------------------------------------------------- |
| 09  | Edit Current Plan — Save Changes disabled without a valid change | Change Weekly Focus mid-week (create v3)            | Usable as reference; no Planned Attention inputs, only Est. Attention                                    |
| 10  | Save New Version Success — Current v2, Original v1 unchanged     | Versions Comparison (Original vs "Actual Plan v3")  | Screen missing; "Actual" is mislabelled — Actual is Contribution time, the latest version is **Current** |
| 11  | Version History — read-only snapshots with timestamps            | Needs Review (total **progress** < 100%)            | Screen missing; Needs Review means total **Planned Attention** < 100% (§4, WF-AC-09), not progress       |
| 12  | Original vs Current vs Actual, incl. Unplanned Attention         | Carry Forward applied automatically ("no new plan") | Screen missing; Carry Forward is only a draft and never auto-confirms (WF-AC-23)                         |

## EPIC-07 — Alignment Dashboard

Spec: [EPIC-07](../epics/EPIC-07_Alignment_Dashboard.md) §9 (screen inventory 01–16). **Sets 2/4 (05–08) and 3/4 (09–12) have no valid
mockup.** Decision (2026-11-09): states 05–12 are built from the EPIC-07 text only. The two single-screen
mockups below are content references for the Default/Empty states.

| File                                                                                               | Source                                                            |
| -------------------------------------------------------------------------------------------------- | ----------------------------------------------------------------- |
| [alignment-dashboard-set-1.png](mockups/epic-07-alignment-dashboard/alignment-dashboard-set-1.png) | `Alignment Dashboard Mockups Set 1_4.png`                         |
| [alignment-dashboard-set-4.png](mockups/epic-07-alignment-dashboard/alignment-dashboard-set-4.png) | `Archipelago Alignment Dashboard Mockups.png`                     |
| [overview.png](mockups/epic-07-alignment-dashboard/overview.png)                                   | `Archipelago Alignment Dashboard Overview.png` (single screen)    |
| [empty-state.png](mockups/epic-07-alignment-dashboard/empty-state.png)                             | `Archipelago Alignment Dashboard Empty State.png` (single screen) |

**Not used:** `Archipelago Analytics Dashboard States.png` (labelled 9–12) — it designs a separate **Analytics** page and sidebar item, a "Last 2 weeks" range, per-Goal progress charts and excludes archived Goals. None of this is in EPIC-07 (Dashboard only, Current/Previous Week, Completed/Archived stay visible — AD-AC-22) or in the approved sidebar (D17). Approved 09–12 are the Previous Week states.

## EPIC-08 — Weekly Reflection & Finalization

Spec: [EPIC-08](../epics/EPIC-08_Weekly_Reflection.md) §10 (16 UI states). **Set 1/4 (states 1–4) is
Sets 1–3 use the correct app shell; set 4 still has the old shell. The "History" tab is out of MVP scope; Screen 15's 100% Unplanned
Attention is corrected in the spec.

| File                                                                                         | Source                                        | States                                                                                                                                                                                            |
| -------------------------------------------------------------------------------------------- | --------------------------------------------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------- |
| [weekly-reflection-set-1.png](mockups/epic-08-weekly-reflection/weekly-reflection-set-1.png) | `Archipelago Weekly Reflection Dashboard.png` | 1–4 — corrections: (a) the sample week Nov 9–15 is the _current_ week, which cannot be in Reflection (D01) — read it as a past week; (b) state 03 Unplanned Attention Δ must be `—`, not "+12 pp" |
| [weekly-reflection-set-2.png](mockups/epic-08-weekly-reflection/weekly-reflection-set-2.png) | `Archipelago Weekly Reflection States.png`    | 5–8 — state 5: Finalize must be disabled while edits are unsaved (D19, §5)                                                                                                                        |
| [weekly-reflection-set-3.png](mockups/epic-08-weekly-reflection/weekly-reflection-set-3.png) | `Weekly Reflection Finalization Flow.png`     | 9–12 — state 12 says "finalized on Nov 8" for the week Nov 2–8; only completed weeks can be finalized, so the date must be ≥ Nov 9                                                                |
| [weekly-reflection-set-4.png](mockups/epic-08-weekly-reflection/weekly-reflection-set-4.png) | `Archipelago Weekly Reflection Mockups.png`   | 13–16 (old app shell — content only)                                                                                                                                                              |

**Not used:**

- `Archipelago Weekly Reflection UI States.png` (current version, an alternative 5–8) — answers marked required with a 500-char limit, a Save Changes/Cancel form instead of autosave, and Finalize enabled while saving or after a failed save; this contradicts D08, D18, D19 and §5.
- `Archipelago Weekly Reflection Mockups(1).png` (old 9–12) — replaced by the Finalization Flow set with the correct app shell.
