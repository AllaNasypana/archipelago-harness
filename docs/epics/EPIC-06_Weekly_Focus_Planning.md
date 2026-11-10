# EPIC-06 — Weekly Focus Planning

**Project:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-06-weekly-focus/`](../design/mockups/epic-06-weekly-focus/) — index with sources and corrections: [design/README.md](../design/README.md#epic-06--weekly-focus-planning)  
**Document language:** English  
**Status:** Product Discovery & Desktop Design Approved; implementation pending  
**Version:** 1.0  
**Date:** 2026-11-09

## 1. Purpose and Scope

Weekly Focus Planning enables users to select a small set of important Goals, explicitly allocate their planned attention, preserve the original intent of the week, revise plans without rewriting history, and compare planned attention with time actually recorded through Contributions.

**In scope:** current/future-week plan creation, 1–5 Focus Goals, allocation and validation, carry-forward drafts, immutable plan versioning, read-only history, Expected Attention recommendations, Actual and Unplanned Attention, weekly navigation, lifecycle restrictions, and desktop UI states.

**Out of scope:** editing plans for past weeks, automatic week finalization, automatic plan confirmation, automatically adjusting plans from Contributions or Progress Events, and historical analytics beyond the current and previous week in the MVP. Weekly Reflection is owned by EPIC-08; the Alignment Dashboard is owned by EPIC-07.

## 2. Approved Product Decisions (32)

### 2.1 Discovery Round 1 — Planning Model (12)

1. A week starts Monday at 00:00 and ends at the next Monday at 00:00 in the week's fixed timezone (a half-open time interval).
2. Plans may be created for the current and future weeks only; retrospective creation is forbidden.
3. The first explicit **Confirm Weekly Plan** establishes the immutable **Original Plan**.
4. Previous Focus Goals are prefilled as an unconfirmed **Carry Forward Draft**, which requires explicit confirmation.
5. Newly selected Focus Goals must be **Active** and belong to **Active Projects**; previously confirmed plans may retain Goals that later become Completed/Archived.
6. Planned Attention is entered as integer percentages.
7. Every selected Goal must receive 1–100% Planned Attention; 0% is invalid.
8. Total Planned Attention above 100% blocks confirmation and saving.
9. The UI uses a numeric percentage field for each Goal and a visible total allocation indicator.
10. Expected Attention percentages are recommendations only; they never auto-fill the plan.
11. Planning, comparisons, and version history live on `/weekly-focus`.
12. Each valid, changed **Save Changes** produces a new plan version.

### 2.2 Discovery Round 2 — History, Lifecycle and Actuals (16)

13. Every confirmation or subsequent save stores a complete, immutable snapshot of the plan.
14. Unconfirmed edits exist only in UI state; navigation with changes warns about discarding them.
15. **Save Changes** is disabled when there is no substantive change; no duplicate version is created.
16. Version History exposes version number, confirmation date/time, and a read-only snapshot.
17. Carry Forward reads the immediately preceding week's latest confirmed **Current Plan**.
18. Completed/Archived Goals carried into a *new week's unconfirmed draft* remain visible with a warning but must be removed or replaced before first confirmation.
19. Carry Forward copies both Focus Goals and their last confirmed Planned Attention values.
20. If the immediately previous week has no confirmed plan, the new draft starts empty; do not search older weeks.
21. Past weeks' plans are read-only, even if Weekly Reflection has not finalized those weeks.
22. Finalized weeks' plan versions are permanently read-only. The only exception is self-service account deletion (BRD FR-046, BR-029), which removes all of the user's data.
23. A week ending without a confirmed plan has **No Confirmed Plan**; do not create Original Plan retrospectively.
24. Confirmed future-week plans may be changed; each changed save creates another version.
25. Expected Attention recommendations are computed from current Project and Goal priorities; changing priorities does not rewrite saved Planned Attention.
26. Actual Attention for a Goal is its Contribution duration divided by all Contribution duration in the selected week, multiplied by 100.
27. Contributions outside the selected Weekly Focus appear as **Unplanned Attention** and remain included in the denominator.
28. A plan with total Planned Attention below 100% can be confirmed; display its unallocated percentage and **Needs Review** status.

### 2.3 Final Discovery — Clarifications (4)

29. If the week has zero Contributions, display **No Activity / No Actual Data**, not a misleading 0% for each Goal.
30. A Goal that becomes Completed/Archived *after* a plan is confirmed may remain in later versions with a warning; newly adding an ineligible Goal is forbidden. This differs from the first-confirmation Carry Forward Draft rule in decision 18.
31. Normalize Expected Attention recommendations to total 100% **among selected Focus Goals**.
32. The selected week is represented by `/weekly-focus?week=YYYY-MM-DD`, where the value is the Monday of that week.

## 3. Concepts and Invariants

| Concept | Definition / invariant |
|---|---|
| Week | Calendar Monday–Monday interval in the timezone assigned to that week; timezone changes do not rewrite past weeks. |
| Draft | Client-side unsaved selection and allocation; not a confirmed plan or server-side draft. |
| Original Plan | First confirmed snapshot, version 1; never overwritten. |
| Current Plan | Most recently confirmed snapshot for the week. |
| Plan Version | Immutable, full snapshot of Focus Goal IDs, their allocation percentages, version number and server confirmation timestamp. |
| Focus Goal | A Goal in a confirmed plan; maximum five and minimum one. |
| Planned Attention | Explicit user-assigned percentage per Focus Goal. |
| Expected Attention | Dynamic recommendation based on priority weighting; not an authoritative plan. |
| Actual Attention | Contribution-duration share across all recorded work for the selected week. |
| Unplanned Attention | Actual share of Contributions attributed to Goals outside the selected plan version. |
| Needs Review | Plan whose total Planned Attention is below 100%; valid but underallocated. |
| Finalized Week | Week finalized through Reflection; historical records are immutable. |

**Priority recommendation baseline:** Project Priority contributes 40% and Goal Priority contributes 60% to the recommendation score. Convert the agreed priority ordering to weights consistently, then normalize scores across the currently selected Focus Goals to sum to 100%. **Approved mapping (D3):** PriorityWeight P1 = 3, P2 = 2, P3 = 1; Weight(i) = 0.4 × ProjectWeight(i) + 0.6 × GoalWeight(i); Expected(i) = Weight(i) / ΣWeight × 100%, rounded to integers with the largest-remainder method so the total is exactly 100; ties are broken by Goal order in the plan. Example: weights 3.0 / 1.4 / 1.6 → 50 / 23 / 27. Expected Attention can change when priorities change, while versioned Planned Attention must not.

**Week identification:** `YYYY-MM-DD` identifies the local Monday in the relevant week's fixed timezone. The API must validate that the date is a Monday and resolve the same week consistently; it must not treat a date-only value as an arbitrary UTC timestamp.

## 4. Functional Requirements

### 4.1 Plan Creation and Validation

- Allow selection of 1–5 unique Goals, each Active in an Active Project when newly selected.
- Provide integer percentage inputs, each 1–100 inclusive, and continuously display total allocation.
- Reject fractional, missing, nonnumeric, zero, negative and >100 per-Goal values; reject totals above 100.
- Total = 100%: valid fully allocated plan. Total < 100%: valid plan, show `100 - total` unallocated and `Needs Review` upon confirmation.
- The first valid confirmation creates Original v1 and Current v1 atomically. Do not auto-confirm from a carried draft or a week boundary.
- Validate all business rules on the server regardless of client UI state.

### 4.2 Carry Forward

- On entering a new unplanned week, prefill the UI-only draft from the immediately preceding week's latest confirmed version, including allocations.
- If the previous week has no confirmed plan, show the empty state.
- Show explicit source-week/version information and allow users to modify or remove prefilled Goals.
- For a first confirmation of the new week, carried Goals that are now ineligible must be removed or replaced before confirmation; the confirm action stays disabled while such entries remain.
- Carry Forward never creates a saved plan until the user confirms.

### 4.3 Editing and Versioning

- A current/future week's confirmed plan can be edited. Changes to Focus Goal membership or allocation produce a new immutable full snapshot on Save Changes.
- Preserve the Original v1 snapshot and all subsequent versions. The newest confirmed version becomes Current.
- If no substantive changes are present, Save Changes is disabled and no version is written.
- Previously confirmed Goals that later become Completed/Archived may be retained in new versions with a warning; do not allow users to newly add an ineligible Goal.
- Display read-only Version History with accurate version numbers and server timestamps. A selected historical version shows its own exact allocations, not live recalculated values.
- Unsaved edits are UI-only. Attempting to navigate away, switch weeks, or otherwise discard an edited draft prompts **Stay on Page** / **Discard Changes**.
- Prevent stale concurrent saves from overwriting another confirmed version; server should enforce an expected current version and reject conflicting writes. Exact conflict UX is an implementation recommendation rather than an approved separate UI state.

### 4.4 Week Lifecycle

- Current/future weeks: creation and changed-version saves are allowed, subject to validation.
- Past weeks: Weekly Plan is read-only even if the week is not finalized; no backdated Original Plan or version may be created.
- A past, not-finalized week may still have permitted Contribution/Reflection workflows governed by EPIC-04/08, but its Weekly Plan cannot be edited.
- Finalized weeks: plan history remains permanently read-only; do not offer reopening of a finalized plan.
- If the week has no confirmed plan, show `No Confirmed Plan` for past-week history/Reflection rather than inventing a plan.

### 4.5 Expected, Actual and Unplanned Attention

- Compute Expected Attention from current Project/Goal priorities using the approved 40%/60% weighting and normalize across selected Focus Goals to 100%; display recommendations without applying them to input values.
- For selected week W, `totalMinutes(W) = sum(durationMinutes of all eligible Contributions dated in W)`.
- For Goal G, `actualPct(G, W) = 100 * minutes(G, W) / totalMinutes(W)` when `totalMinutes(W) > 0`.
- For comparison against plan version V, `unplannedPct(V, W) = 100 * minutes(for Goals not in V, W) / totalMinutes(W)`.
- Include all Contributions in the denominator, even if the Goal is outside the Focus. The `Unplanned Attention` grouping is relative to the version being compared (Original or Current), so its membership may differ across comparisons.
- If `totalMinutes(W) = 0`, show `No Activity / No Actual Data`; percentages are undefined and should not be shown as 0%.
- Contributions may be created/edited/deleted only under EPIC-04 rules; permitted changes recompute Actual without creating plan versions. Progress Events (EPIC-05) do not affect Actual.
- Percentage display rounding must preserve underlying precision; the displayed sum may require a documented rounding strategy. Never mutate raw Contribution durations to force a visual 100%.

## 5. User Flows (12)

### WF-01 — Create First Weekly Plan
1. Open current/future week with no confirmed plan.
2. Select 1–5 eligible Goals and enter integer Planned Attention.
3. Review Expected recommendations and total allocation.
4. Click **Confirm Weekly Plan**.
5. Server validates and stores immutable Original v1; UI shows Confirmed and Current v1.

### WF-02 — Carry Forward Previous Focus
1. Navigate to a new unplanned week.
2. UI prepopulates previous week's Current Plan Goals and percentages as Draft.
3. User reviews and adjusts; no plan is persisted yet.
4. User explicitly confirms to create Original v1.

### WF-03 — Resolve Ineligible Carried Goals
1. Carried Draft includes a now-Completed or Archived Goal/Project.
2. Show warning on affected rows and explain required action.
3. Disable first confirmation until affected Goals are removed/replaced.
4. Confirm only after all newly confirmed entries are eligible.

### WF-04 — Edit Current Weekly Plan
1. Open a confirmed current/future plan and choose **Edit Plan**.
2. Adjust Goals/allocations while retaining any previously confirmed, subsequently inactive Goals if desired.
3. **Save Changes** becomes enabled only for a changed, valid plan.
4. Save creates immutable vN+1; Original and older versions remain unchanged.

### WF-05 — Review Version History
1. Open **Version History** for a selected week.
2. Select a version with its timestamp and label (Original/Current where applicable).
3. View its immutable Focus Goal list and Planned Attention in read-only mode.

### WF-06 — Confirm Underallocated Plan
1. Enter valid allocations totaling less than 100%.
2. Show unallocated amount and **Needs Review** indication.
3. Allow confirmation and persist a plan with Needs Review status.

### WF-07 — Reject Overallocation
1. Enter allocations totaling more than 100%.
2. Show total and inline validation error.
3. Disable confirmation/save until allocation is at most 100%.

### WF-08 — Compare Planned and Actual
1. Open Comparison for a week with Contributions.
2. Show Original vs Actual and Current vs Actual.
3. Include Unplanned Attention for work outside the compared version.
4. If no Contributions exist, show No Actual Data instead of 0%.

### WF-09 — View Past Week
1. Select a past week by date or week navigation.
2. Display the last confirmed plan and Version History read-only, or No Confirmed Plan.
3. Distinguish `Past Week · Not Finalized` from `Past Week · Finalized`; Reflection availability follows EPIC-08.

### WF-10 — Guard Unsaved Changes
1. Modify an unconfirmed Draft or edit a confirmed plan without saving.
2. Attempt navigation, including a week switch.
3. Display Unsaved Changes dialog with Stay on Page and Discard Changes.
4. Stay preserves edits; Discard navigates and drops the UI-only changes.

### WF-11 — Plan Future Week
1. Navigate to a future Monday.
2. Create/confirm a new plan or edit an already confirmed future plan.
3. Save valid changes as new immutable versions.

### WF-12 — No Confirmed Plan
1. Open a week without a confirmed plan.
2. Current/future week: allow creation; use carry-forward if an immediately previous confirmed plan exists.
3. Past week: show read-only No Confirmed Plan; never backfill Original v1.

## 6. Acceptance Criteria (40)

### A. Weekly Plan Creation
- **WF-AC-01:** Weekly periods begin Monday 00:00 in the fixed weekly timezone.
- **WF-AC-02:** Users can create plans for current and future weeks.
- **WF-AC-03:** Past weeks cannot receive new plans.
- **WF-AC-04:** A confirmed plan must contain 1–5 unique Focus Goals.
- **WF-AC-05:** Newly selected Goals must be Active and belong to Active Projects.
- **WF-AC-06:** Planned Attention is an integer from 1 to 100 for each Goal.
- **WF-AC-07:** Total Planned Attention cannot exceed 100%.
- **WF-AC-08:** Confirm and Save are blocked when allocation exceeds 100%.
- **WF-AC-09:** A plan below 100% can be confirmed with Needs Review.
- **WF-AC-10:** Unallocated Attention is displayed when total is below 100%.

### B. Versioning and Drafts
- **WF-AC-11:** First explicit Confirm creates Original Plan v1.
- **WF-AC-12:** Each subsequent changed Save Changes creates a full immutable snapshot.
- **WF-AC-13:** Original Plan remains unchanged after later edits.
- **WF-AC-14:** Current Plan is the latest confirmed version.
- **WF-AC-15:** Save Changes is disabled if there are no substantive changes.
- **WF-AC-16:** Unsaved Draft changes are held in UI state only.
- **WF-AC-17:** Attempted navigation with unsaved changes triggers a warning.
- **WF-AC-18:** Version History shows version number, server timestamp, and read-only snapshot.
- **WF-AC-19:** Previous versions cannot be modified.
- **WF-AC-20:** Confirmed future plans may be edited by saving new versions.

### C. Carry Forward
- **WF-AC-21:** Carry Forward uses the immediately preceding week's latest confirmed plan.
- **WF-AC-22:** Carried Goals and allocations populate an unconfirmed Draft.
- **WF-AC-23:** Carry Forward never confirms a plan automatically.
- **WF-AC-24:** Ineligible carried Goals remain visible with warning.
- **WF-AC-25:** Ineligible carried Goals must be removed/replaced before first Confirm.
- **WF-AC-26:** Without a confirmed previous-week plan, the new Draft is empty.

### D. Weekly Lifecycle
- **WF-AC-27:** Past weeks are read-only for planning, even when not finalized.
- **WF-AC-28:** Finalized weeks and their versions remain permanently immutable.
- **WF-AC-29:** A week without a confirmed plan has no Original Plan.
- **WF-AC-30:** Week end never automatically confirms a Draft.
- **WF-AC-31:** Reflection may finalize a past week without a confirmed plan.
- **WF-AC-32:** Profile timezone changes do not modify historical week boundaries.

### E. Recommendations and Actual Attention
- **WF-AC-33:** Expected Attention uses current Project and Goal Priorities, with 40%/60% weighting, normalized to 100% across selected Focus Goals.
- **WF-AC-34:** Recommendations never automatically populate Planned Attention.
- **WF-AC-35:** Priority changes do not modify saved plan snapshots.
- **WF-AC-36:** Actual Attention uses all Contributions for the selected week; zero total duration displays No Actual Data.
- **WF-AC-37:** Actual Attention per Goal equals its Contribution duration divided by all weekly Contribution duration.
- **WF-AC-38:** Contributions outside the compared Weekly Focus version appear as Unplanned Attention.
- **WF-AC-39:** Actual changes do not create Weekly Plan versions.
- **WF-AC-40:** Original vs Actual and Current vs Actual comparisons are available.

**Additional approved invariants applying throughout AC testing:** previously confirmed Goals that later become inactive can remain in new versions with warnings; new ineligible Goals cannot be added; no backdated confirmation; version snapshots are immutable.

## 7. Desktop Design Specification — 16 Approved UI States

**Design system:** Grafana-inspired functional light UI; white/gray surfaces, restrained orange accent, compact tables and metrics, accessible states and responsive behavior. All mockups are conceptual, not implemented. Display accurate data counts and allocations; never fabricate user metrics in production.

| # | Screen Name | URL | UI State | Required UI behavior |
|---|---|---|---|---|
| 01 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Empty / First Plan | No plan, Create Weekly Plan CTA. |
| 02 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Create Draft | Eligible Goal selection, integer inputs, recommendations, total, Confirm. |
| 03 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Allocation 100% | Fully allocated state; Confirm enabled. |
| 04 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Needs Review / Underallocated | Unallocated amount and warning; Confirm allowed; Needs Review persists after confirmation. |
| 05 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Overallocation Validation Error | Total >100%, inline error, Confirm disabled. |
| 06 | Weekly Focus | `/weekly-focus?week=2026-11-16` | Carry Forward Draft | Show source previous week/version; copied Goals and allocations; not confirmed. |
| 07 | Weekly Focus | `/weekly-focus?week=2026-11-16` | Ineligible Carried Goals | Warning per ineligible Goal; Confirm disabled until removal/replacement; selector must show **Nov 16–22, 2026**. |
| 08 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Original Plan Confirmed | Original v1 and Current v1 labels; Edit Plan and Version History. |
| 09 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Edit Current Plan | Save Changes disabled unless a substantive, valid change exists. |
| 10 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Save New Version Success | Confirmation feedback; Current v2, Original v1 unchanged. |
| 11 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Version History / Read-only Snapshot | Accurate versions, timestamps, and frozen allocations. |
| 12 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Original vs Current vs Actual | Distinct Original/Current allocations and Contribution-derived Actual; include Unplanned Attention. |
| 13 | Weekly Focus | `/weekly-focus?week=2026-11-09` | Unplanned Attention | Outside-Focus work shown separately, included in Actual denominator. |
| 14 | Weekly Focus | `/weekly-focus?week=2026-11-02` | Past Week / Read-only | Distinguish **Past Week · Not Finalized** (Reflection available) vs **Past Week · Finalized** (historical records locked); Weekly Plan read-only in both. |
| 15 | Weekly Focus | `/weekly-focus?week=2026-11-23` | Future Week | Create or edit a future-week plan; confirmation and versioning permitted. |
| 16 | Weekly Focus | `/weekly-focus?week=2026-11-23` | Unsaved Changes Warning | Modal with Stay on Page / Discard Changes; URL and selector both indicate **Nov 23–29, 2026**. |

**Navigation:** `/weekly-focus` defaults to the current week; `?week=YYYY-MM-DD` is the URL source of truth for an explicitly selected week. Week navigation must support refresh and browser Back/Forward. Plan/Comparison/History may be sections or tabs within the same page; version snapshots must remain read-only.

**Approved corrections incorporated:** Set 1 Needs Review persists after confirmation; Set 2 state 07 date range corrected; Set 3 Save Changes disabled without edits; Set 4 state 14 distinguishes finalized status and state 16 corrects week URL. Set 3 (`weekly-focus-set-3.png`): only state 09 is a valid visual reference; states 10–12 are implemented from this table and §4/WF-05/WF-06 text only — the drawn 10–12 panels ("Actual Plan", Needs Review by progress, auto-applied Carry Forward) contradict this spec and must be ignored.

## 8. Integration Contracts and Data Integrity

### EPIC-02 — Projects
- Project lifecycle and priority are authoritative in the Projects domain.
- Archived Project prevents newly selecting its Goals; existing confirmed plan references remain historically visible.
- Priority changes affect live recommendations only.

### EPIC-03 — Goals
- Goal lifecycle and Project association determine eligibility for newly selected Goals.
- A confirmed Goal becoming Completed/Archived may remain in later saved versions with a warning.
- Keep Goal IDs in snapshots and resolve display names carefully; the snapshot's allocation and membership are immutable even if metadata changes. Whether to snapshot display names is an implementation choice.

### EPIC-04 — Contributions
- Contribution durations and their week assignment determine Actual Attention.
- Respect historical timezone and finalized-week editing restrictions.
- Recalculate Actual when a permitted Contribution is created/edited/deleted; do not mutate Weekly Plan versions.

### EPIC-05 — Progress Tracking
- Progress Events and Goal progress percentage are independent of attention allocation.
- Progress updates do not change Planned or Actual Attention.

### EPIC-07 — Alignment Dashboard
- Expose Original and Current plan snapshots plus calculated Actual Attention for current/previous-week comparison.
- Do not invent data for weeks without confirmed plans or without Contributions.

### EPIC-08 — Weekly Reflection
- Reflection owns explicit week finalization and associated historical immutability.
- A past week's Weekly Plan is read-only regardless of whether Reflection has finalized it.
- A past week with No Confirmed Plan may still be finalized under Reflection rules.

### Technical recommendations (not additional approved product decisions)
- Use a `WeeklyPlan` identity keyed by user/workspace and week, with immutable `WeeklyPlanVersion` rows and child allocation snapshots.
- Store version creation and allocation rows atomically; enforce unique `(planId, versionNumber)` and one Goal per version.
- Use optimistic concurrency (`expectedCurrentVersion`) and transactional validation to prevent simultaneous saves from silently overwriting a version.
- Validate eligibility against current Goal/Project status at save time, distinguishing retained prior members from newly added members.
- Keep all business rules authoritative in NestJS; Next.js BFF remains thin and holds no business authority.
- Define and test priority score mapping, rounding, timezone conversion, and snapshot serialization before implementation.
- Use URL query params as week-selection state and invalidate/re-fetch comparison queries when relevant Contributions change.

## 9. Error, Empty and Edge Cases

| Scenario | Expected behavior |
|---|---|
| 0 selected Goals | Cannot confirm; require 1–5. |
| 6+ selected Goals | Cannot confirm/save. |
| Duplicate Goal selection | Prevent duplicates. |
| Invalid percent (0, >100, decimal, missing, nonnumeric) | Inline error; cannot confirm/save. |
| Total >100% | Overallocation error; action disabled. |
| Total <100% | Show unallocated share; allow confirmation; persist Needs Review. |
| No previous confirmed plan | Empty draft, no carry-forward from older weeks. |
| Carried Goal now inactive | Keep visible with warning; require removal/replacement before first confirmation. |
| Confirmed Goal later inactive | Keep in later versions with warning; block newly adding inactive Goals. |
| Save unchanged plan | Disabled; no new version. |
| Unsaved navigation | Stay / Discard warning. |
| Past week not finalized | Plan read-only; Reflection may remain available. |
| Past week finalized | Plan and finalized historical data read-only. |
| Past week without plan | No Confirmed Plan; no retrospective Original v1. |
| No weekly Contributions | No Activity / No Actual Data, not 0%. |
| Work outside selected plan | Unplanned Attention; included in denominator. |
| Priority changed after confirmation | Update recommendation only, never stored plan snapshot. |
| Contribution edited in open week | Recompute Actual; no plan version. |
| Concurrent version save | Reject stale save and require refresh/review (recommended implementation behavior). |
| API validation/server error | Keep draft values, display actionable error, avoid creating partial version (recommended UX). |

## 10. QA Checklist

- [ ] Week boundaries and DST changes use the week's fixed timezone; week query date is a Monday.
- [ ] Current/future creation permitted; past creation and editing rejected by server.
- [ ] Only 1–5 unique Focus Goals; integer 1–100% allocations; total <=100%.
- [ ] Underallocated plans confirm with persistent Needs Review; overallocation blocks.
- [ ] First Confirm creates immutable Original v1; changed saves create successive immutable full snapshots.
- [ ] Unchanged Save disabled; unsaved navigation guarded.
- [ ] Carry Forward uses immediately previous Current Plan and copies allocations into UI-only draft.
- [ ] Ineligible carried Goals block first confirmation; subsequently inactive confirmed Goals can be retained with warning.
- [ ] Version History displays correct snapshots, dates, and version labels.
- [ ] Dynamic Expected recommendations normalize among selected Focus Goals and do not rewrite snapshots.
- [ ] Actual denominator includes all weekly Contributions; out-of-focus work is grouped as Unplanned.
- [ ] No Contributions renders No Actual Data.
- [ ] Past nonfinalized and finalized UI states are distinguished; neither allows plan editing.
- [ ] URL, week selector, refresh and Back/Forward remain consistent.
- [ ] Concurrent save and transactional failure cannot corrupt version history.
- [ ] All 16 approved UI states and corrections are covered by visual and interaction tests.

## 11. Definition of Done

1. All 40 acceptance criteria pass automated or documented manual verification.
2. All 12 flows are implemented or covered by explicit test scenarios.
3. All 16 approved UI states are implemented with their corrections and accessibility checks.
4. NestJS enforces plan eligibility, week lifecycle, immutable versioning and validation; BFF remains thin.
5. Actual Attention correctly integrates EPIC-04 Contributions; recommendations use approved priority weighting without altering stored plans.
6. Current/previous week comparison data is available to EPIC-07, and finalized/past-week rules integrate with EPIC-08.
7. Error handling, empty states, timezone boundaries, concurrency and history integrity are tested.

## 12. Open Implementation Decisions (Not New Business Requirements)

- ~~Numeric weight mapping and rounding of Expected Attention~~ — resolved (D3, §3).
- Percentage rounding/display precision for Actual Attention and how to show small values while preserving accurate totals.
- The exact persistence schema, API route naming, concurrency error message, and retry flow.
- Whether the historical snapshot also stores display labels in addition to stable Goal IDs.
- Detailed mobile/responsive layouts and accessibility interaction specifics.

These decisions must be resolved consistently during engineering design; none should silently override the approved product rules above.

---

**Approval record:** Discovery Rounds 1–2 and Final Discovery approved (32 decisions); Desktop Sets 1–4 approved (16 states) with all noted corrections. User Flows and Acceptance Criteria were drafted and consolidated into this final product specification. **Implementation has not been claimed or verified.**


## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Priority weights P1=3/P2=2/P3=1, largest-remainder rounding, plan-order tie-break approved | D3 (Q3), C4 |
| 2026-11-10: account-deletion exception to immutability | D6, BR-029 |
