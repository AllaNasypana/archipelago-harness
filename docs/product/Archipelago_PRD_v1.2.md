# ARCHIPELAGO — Product Description & Business Requirements

**Product Requirements Document (PRD) · Version 1.2 · 9 November 2026**
**Status:** Reconciled draft, aligned with approved EPIC-01–08 and `archipelago-business-requirements.md` (BRD v0.4). Supersedes PRD v1.0 (8 Nov 2026) and the v1.1 reconciled draft. Where this PRD and an approved epic differ, the epic wins; the BRD records every resolution.

## 1. Executive Summary

Archipelago is a personal SaaS application for intentional allocation of attention across meaningful life priorities. It helps users choose a weekly focus, record time invested toward goals, reflect on actual behavior, and adjust future priorities. It is not a conventional task manager, automated time tracker, or productivity scoring system.

**Product promise:** Focus on what matters. Align your time with your priorities.

## 2. Product Vision and Principles

- **Choose Focus → Invest Time → Reflect → Adjust** is the core product loop.
- **Reflection over productivity:** differences between planned and actual attention are information, not failure.
- **Effort is not progress:** recorded duration never changes goal progress automatically.
- **User control:** recommendations require confirmation before they become a plan.
- **Historical integrity:** finalized weekly records are immutable through normal product operations; the only exception is self-service account deletion, which removes all of the user's data.
- Personal-first, low-friction and nonjudgmental experience.
- Clarity over decoration: data-rich screens should remain understandable and fast.

## 3. Target Users and Success Outcomes

Primary audience: individuals balancing personal development, health, learning, relationships and independent projects. Secondary audience: independent professionals managing multiple professional and personal priorities.

- Users can identify 1–5 important goals for a week and allocate up to 100% of planned attention (a plan below 100% is valid and marked Needs Review).
- Users can log actual time, including work outside the weekly focus.
- Users can compare initial and revised plans against the same weekly actuals.
- Users can finalize an honest weekly reflection without being forced to write explanatory text.
- A returning user can log a Contribution in under 10 seconds.

## 4. MVP Scope

| Included in MVP | Excluded / Later |
|---|---|
| Authentication (email/password or Continue with Google) and personal workspace | Team collaboration, role-management UI, admin UI; social login other than Google |
| Projects, goals, priorities and archive states | Interactive archipelago map |
| Manual contributions and progress history | Automatic timer, integrations, bulk entry |
| Weekly focus, recommendations, versioning and carry-forward | AI insights and recommendations |
| Alignment dashboard (current and previous week) and weekly reflection | Advanced historical analytics |
| Manual finalization and pending reflections | Dark theme |
| Settings: name, timezone, language, change password, email status, account deletion | Avatar upload; data export |
| English and Ukrainian localization in the first MVP release (Ukrainian implementation may follow core epics) | Gamification |

## 5. Domain Concepts

| Entity | Business meaning |
|---|---|
| Personal Workspace | Private context containing a user's projects and goals. |
| Project | Strategic area of importance, with priority P1–P3 and independent archive state. |
| Goal | Desired outcome under a project; priority, progress, status, deadline and archive state. |
| Contribution | Manually recorded amount of time invested toward a goal on an activity date. |
| Progress Event | Immutable record of one change of a goal's progress, stamped with the server save time. |
| Weekly Period | Monday 00:00 to next Monday 00:00 with a fixed IANA time-zone snapshot. |
| Weekly Focus | Selection of 1–5 goals with Planned Attention percentages. |
| Plan Version | Immutable confirmed version of weekly focus and allocations (v1 = Original Plan, latest = Current Plan). |
| Weekly Reflection | Optional written reflections and explicit finalization of a completed week. |

## 6. Project and Goal Requirements

### 6.1 Project
- Required on creation: name (2–100 characters, unique per workspace, case-insensitive, archived names stay reserved) and priority (P1, P2 or P3, no default). Description is optional (≤1,000).
- Priority changes are recorded and do not silently update confirmed weekly plans.
- Archiving hides a project from active views without changing goal statuses or historical records.
- While a project is archived, it is read-only: creating goals, creating/editing/deleting contributions and changing goal progress are blocked.
- Restoring a project restores access to active, non-archived goals but does not alter each goal's archive flag.
- Projects cannot be deleted in the MVP.

### 6.2 Goal lifecycle
- Required on creation: project, name (unique within the project) and priority; description and deadline are optional. The project cannot be changed later.
- Initial state: Active, progress 0%, not archived.
- Status is Active or Completed; Archived is a separate independent flag.
- Completion requires 100% progress and an explicit user confirmation. Reaching 100% alone never completes a Goal.
- Completed goals can be reopened; completion history and progress are preserved; reopening creates no Progress Event.
- Reopening does not automatically restore weekly focus membership.
- Archived goals are hidden from active views and block new contributions until restored; a goal under an archived project can be restored only after the project.
- Goal or project archiving never rewrites confirmed weekly plans or finalized history.
- An Overdue indicator is shown only for Active, non-archived goals past their deadline and never changes status.
- Goals cannot be deleted or moved between projects in the MVP.

### 6.3 Historical eligibility
Creating a Contribution requires a currently Active Goal and non-archived Project. A Completed Goal must be reopened before a new Contribution can be added. For dates on or after Goal creation, the Goal must also have been Active during at least part of the activity date. Approved exception: dates before Goal creation are allowed without historical Active-date eligibility, provided current status, non-future date, duration and unfinalized-week checks pass. This never changes the Goal creation timestamp.

## 7. Contribution Business Rules

| ID | Rule |
|---|---|
| CT-01 | Duration is an integer from 1 through 1,440 minutes, inclusive (entered as Hours 0–24 and Minutes 0–59). |
| CT-02 | Activity date must be today or earlier in the profile timezone; future activity dates are rejected. |
| CT-03 | Multiple contributions for the same goal and day are permitted. |
| CT-04 | Note is optional (≤500 characters); time is entered manually. |
| CT-05 | Create, edit and delete are permitted only for unfinalized weeks and while the goal and its project are not archived. |
| CT-06 | Moving a contribution across weeks requires both source and destination weeks to be unfinalized. |
| CT-07 | Changing activity date triggers revalidation of goal eligibility and date constraints. |
| CT-08 | A daily total above 24 hours produces a nonblocking warning. |
| CT-09 | Archived goal or project blocks new contributions, including historical entries. |
| CT-10 | Deleting a contribution never deletes or changes Progress Events or progress. |
| CT-11 | The goal of a contribution cannot be changed after creation. |

## 8. Progress and Historical Events

- Goal progress is a manually set absolute integer percentage between 0 and 100, including decreases.
- Each successful change creates exactly one immutable Progress Event with previous %, new %, the **server save timestamp** and an optional note (≤500).
- Progress Events cannot be backdated, edited or deleted; there is no Effective Date. Corrections are new events.
- Contributions never create, change or delete Progress Events.
- A Progress Event belongs to the week containing its server timestamp under that week's fixed timezone.
- A week's starting progress is the latest event strictly before the week start (0% if none); its ending progress is the latest event strictly before the week end.
- Finalized weekly records remain unchanged by subsequent events.
- Completed, archived, or archived-project goals cannot change progress until reopened/restored.

## 9. Weekly Focus and Planned Attention

- A confirmed weekly plan contains 1–5 eligible Goals, each assigned 1–100% integer Planned Attention. Total Planned Attention must not exceed 100%; a total below 100% is valid and marked **Needs Review**, with the unallocated share shown.
- Plans can be created only for the current and future weeks; past weeks are read-only even if not finalized, and no plan is ever created retrospectively.
- The first confirmed version, regardless of when in the week it is confirmed, is **Original Plan**.
- Subsequent confirmed revisions become **Current Plan** while preserving Original Plan and all versions. Saving without a substantive change is not possible.
- Priorities can change at any time; saved plans change only after explicit user confirmation.
- Unplanned contributions (to goals outside the plan) are permitted and included in total logged time.
- Newly added goals must be Active in Active projects. Goals that become Completed or Archived after confirmation may remain in later versions with a warning.
- When five goals are already selected, the UI may offer replacement instead of adding a sixth.

### 9.1 Recommendation formula (Expected Attention)
- PriorityWeight: P1 = 3, P2 = 2, P3 = 1.
- Weight(i) = 0.4 × ProjectPriorityWeight(i) + 0.6 × GoalPriorityWeight(i).
- Expected(i) = Weight(i) / Σ Weight of selected Focus Goals × 100%.
- Integer percentages via the largest-remainder method so that the total is exactly 100%; ties are broken by Goal order in the plan.
- Example: weights 3.0, 1.4, 1.6 → 50.0, 23.33, 26.67 → **50, 23, 27**.
- Recommendations are advisory, use current priorities, and never auto-fill or change plans. Users manually assign Planned Attention before confirming.

### 9.2 Carry forward
- When a user opens an unplanned current or future week, the UI prefills a **draft** from the immediately preceding week's Current Plan (goals and percentages). The draft is not saved until the user confirms it.
- If the previous week has no confirmed plan, the draft is empty (older weeks are not searched); show the empty "Plan your week" state.
- Carried goals that are now Completed or Archived stay visible with a warning and must be removed or replaced before the first confirmation.
- A week that ends without a confirmed plan has **No Confirmed Plan**; nothing is confirmed automatically.
- Contributions remain possible without a confirmed plan, but no alignment comparison ever uses an unconfirmed draft.

## 10. Alignment Analytics

- Tracked Time = sum of all contribution minutes in the week.
- ActualAttention(goal) = LoggedMinutes(goal) / TrackedMinutes(week) × 100%.
- Focus Attention = minutes on goals in the selected plan version / Tracked Time × 100%; Unplanned Attention = the remainder.
- Deviation = Actual − Planned, displayed in percentage points (pp), one decimal place, computed from exact minutes.
- Show Original Plan vs Actual and Current Plan vs Actual using the same whole-week actuals; Unplanned classification is relative to the selected plan version.
- Goals removed from a later plan remain visible in comparisons to Original Plan.
- When no time is logged, actual shares are undefined (**No Actual Data**), not 0%.
- When no confirmed plan exists, Focus/Unplanned and expected-versus-actual comparison are unavailable (never "100% Unplanned").
- Rule-based insights only (max 4: Missing Activity → Underallocated Plan → Unplanned Attention → deviations ≥ 10.0 pp). Do not assign a single productivity or alignment score in MVP.
- The dashboard supports the current and previous week; older unfinalized weeks remain accessible through Pending Reflections.

## 11. Weekly Reflection and Finalization

- Reflection is a short form with three optional answers (What went well? / What didn't go as planned? / What will I change next week?), ≤2,000 characters each, autosaved on the server.
- Only weeks whose calendar end has passed can be finalized; all past weeks since the user's first week are available.
- Users may finalize a week even if no weekly focus was confirmed or no time was logged.
- Calendar week completion does not trigger automatic finalization.
- Finalization is manual, irreversible and preceded by a clear confirmation; finalized weeks cannot be reopened (account deletion removes them together with all user data).
- After finalization, the week's contributions, progress events, plan versions and reflection answers are locked.
- Older weeks may remain unfinalized and may be finalized in any order; Pending Reflections never block current activity.
- Finalizing a week derives its progress review from historical events, never from current goal progress, and never changes goals, contributions or plans.

## 12. Time Zones and Localization

- Each weekly period uses Monday–Sunday boundaries in its stored IANA time zone.
- The profile time zone is auto-detected from the browser at registration (UTC if unavailable) and can be changed in Settings.
- Changes to the profile time zone apply from the next calendar week and do not recalculate historical weeks.
- Contribution eligibility and week membership use the applicable weekly time-zone boundaries.
- English (en) and Ukrainian (uk) localization are both required for the first MVP release. English is the default interface language. Ukrainian localization may be implemented after core epics during MVP hardening, but must be completed before launch.
- Users can switch between English and Ukrainian; the choice is saved on the account. Toggle labels: EN / УКР.
- User-facing copy must be localization-ready from initial implementation. Navigation, forms, validation, errors, analytics, Weekly Focus and Reflection UI must be available in both languages at the first MVP release.
- User-authored project and goal names, contribution notes and reflection answers are not automatically translated.
- Localization never changes calculations, stored values or historical records.

## 13. Design and UX Requirements

Visual reference: Grafana's light dashboard interface. The intended direction is a restrained light theme, white and gray surfaces, orange accent, compact panel grids, readable tables and charts, and active tabs indicated with orange. This is a design reference, not a mandate to reproduce Grafana.

| Aspect | Requirement |
|---|---|
| Theme | Light only in MVP; dark theme is out of scope. |
| Palette | White and gray are primary; orange is the main interaction accent. |
| Visual hierarchy | Period, status, key metrics, comparison charts, details, then actions. |
| Cards and tables | Compact, consistent spacing, subtle borders, aligned numbers and units. |
| Charts | Legends and labels; distinguish series by more than color. |
| Accessibility | Semantic controls, keyboard navigation, visible focus and WCAG 2.2 AA target. |
| Responsive behavior | Responsive web. Login, Add Contribution, Dashboard and Reflection fully usable at 360 px; no horizontal page scroll on any screen. |
| Localization | Layouts must support both English and Ukrainian at first MVP launch without clipping. |
| Navigation | App shell per `docs/design/mockups/general/alignment-dashboard*.png`: header with logo, EN / УКР toggle and profile menu; collapsible sidebar Dashboard, Projects, Goals, Contributions, Weekly Focus, Reflection, then a Workspace group with Settings and Account. Auth pages and onboarding without sidebar. |
| UI states | Loading, empty, error, success, warning, disabled, unsaved changes, Needs Review, no data, completed, archived, pending reflection and finalized. |
| Color semantics | Orange is not a universal error color; status meaning must not rely on color alone. |

Exact HEX colors, typography, spacing tokens and final component styling will be defined in the design specification and desktop mockups.

## 14. Core User Journeys

1. **Onboard:** register (signed in immediately), optionally create first project, goal and weekly focus — every step can be skipped.
2. **Plan:** choose 1–5 goals, inspect weighted suggestions, enter shares, confirm weekly focus.
3. **Invest:** add contributions, including eligible backdated entries; update goal progress separately.
4. **Monitor:** inspect actual time and compare against Original or Current Plan.
5. **Reflect:** review a completed week, optionally write reflections, confirm irreversible finalization.
6. **Adjust:** change priorities, reopen or archive goals, plan the next week.

## 15. Acceptance Criteria by Epic

**Identity & Workspace**
- Successful registration creates a personal workspace and signs the user in.
- Users can register and sign in with Google; a verified Google email that matches an existing account is linked to it.
- User data is restricted to authorized access.
- An empty workspace offers a clear first-project action.

**Settings**
- Users can change name, timezone (from next week), language and password, see email status and delete their account.

**Projects & Goals**
- Name and priority are required.
- Completed goals can be reopened with history preserved.
- Archiving blocks contributions without deleting history.

**Contributions**
- Duration outside 1–1440 integer minutes is rejected.
- Future activity dates are rejected.
- Cross-week date edits require two unfinalized weeks.
- A daily total above 1,440 minutes triggers a nonblocking warning.

**Progress**
- Each progress change creates exactly one immutable, server-timestamped event.
- Progress events cannot be backdated, edited or deleted.
- Deleting a contribution does not delete progress history.

**Weekly Focus**
- Confirmed plans contain 1–5 Goals with integer Planned Attention totaling no more than 100%; underallocation is permitted with Needs Review.
- Original and Current plan versions remain distinguishable.
- Carried-forward drafts are never confirmed automatically; ineligible carried goals must be resolved before first confirmation.

**Alignment**
- All weekly contributions count in the actual denominator.
- Original and Current comparisons use the same actuals.
- No data and no confirmed plan have explicit distinct states.

**Reflection**
- Text answers are optional.
- Finalization is manual and irreversible.
- Pending old weeks can be finalized separately and out of order.

**Localization & UX**
- Both English and Ukrainian UI localization are acceptance criteria for the first MVP release; English is the default.
- Light gray/white/orange visual direction is followed.
- Core screens support responsive, accessible interactions and complete UI states.

## 16. Non-functional Requirements

- Protect user data and enforce workspace authorization consistently.
- Preserve atomicity and consistency for finalization, plan versions, progress updates and contribution modifications.
- Provide understandable errors and safe retry behavior without leaking private information.
- Support keyboard access, visible focus, legible contrast and accessible data visualizations.
- Performance (initial targets for ≤100 users): p95 API latency < 300 ms; Dashboard first meaningful render < 2 s; logging a contribution < 10 s for a returning user.
- Availability is best-effort (no SLA); daily database backups retained for 30 days.
- Preserve immutable historical plan versions, events and finalized snapshots.
- Maintain diagnostics without exposing passwords, tokens or private reflection text in logs.
- Users can delete their account; all their data is permanently removed (backups expire within 30 days). Data export is post-MVP.

## 17. Release Sequence

1. **Foundation:** identity, personal workspace, settings, projects and goals.
2. **Time and progress:** manual contributions, progress events and lifecycle.
3. **Weekly planning:** focus, attention recommendations, carry forward and versions.
4. **Reflection and alignment:** dashboard, comparisons, pending reflections and finalization.
5. **Release hardening:** complete Ukrainian localization (English default), bilingual QA, accessibility, mobile gate, edge-case testing, security and responsive polish before first MVP launch.

## 18. Approval and Next Deliverables

The core concept is settled; the remaining work is specification detail: exact design tokens, screen-level interaction design for Settings, and engineering acceptance tests. Technical choices (API contracts, persistence, infrastructure beyond the simplified MVP baseline) are made through ADRs.

## Revision log

| Version | Date | Change | Decision / conflict |
|---|---|---|---|
| 1.0 | 2026-11-08 | Baseline | — |
| 1.1 | 2026-11-09 | Reconciled draft: completion at 100%, reopen before contributions, ≤100% allocation, localization gate | — |
| 1.2 | 2026-11-09 | Header/status corrected (v1.1 still said "v1.0 · Approved") | C16 |
| 1.2 | 2026-11-09 | §3 "allocate 100%" → "up to 100%" | C3 |
| 1.2 | 2026-11-09 | §8: Effective Date and contribution-initiated events removed; server timestamp only | D1, C5 |
| 1.2 | 2026-11-09 | §9.1: weights P1=3/P2=2/P3=1, largest-remainder rounding approved | D3, C4 |
| 1.2 | 2026-11-09 | §9.2: carry-forward is a draft; Needs Review means underallocated confirmed plan | C6, C7 |
| 1.2 | 2026-11-09 | "Outside Focus" → "Unplanned Attention"; no-plan semantics | C9 |
| 1.2 | 2026-11-09 | CT-05/CT-11: archived goal/project blocks edit/delete; goal immutable | C10 |
| 1.2 | 2026-11-09 | §12: timezone auto-detect; language persisted per account; EN/УКР labels | D2, D5, A4 |
| 1.2 | 2026-11-09 | §4/§15: Settings scope, account deletion; admin, avatar, export excluded | D5, D6, D7 |
| 1.2 | 2026-11-09 | §6: archived names reserved; Overdue only for Active goals | D10, D13 |
| 1.2 | 2026-11-09 | §13: mobile gate; navigation | D9, A3 |
| 1.2 | 2026-11-09 | §16: quantitative targets, retention | D16, A8 |
| 1.2 | 2026-11-09 | §13: navigation updated to the reference app shell | D17 |
| 1.2 | 2026-11-09 | §2/§11: account deletion is the only exception to historical immutability | D6 |
| 1.2 | 2026-11-10 | §4/§15: Continue with Google added (auto-link by verified email) | D18–D21 |
