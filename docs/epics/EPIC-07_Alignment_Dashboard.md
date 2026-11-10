# EPIC-07 — Alignment Dashboard

**Product:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-07-alignment-dashboard/`](../design/mockups/epic-07-alignment-dashboard/) — index with sources and corrections: [design/README.md](../design/README.md#epic-07--alignment-dashboard)  
**Status:** Final Product Specification — Discovery Approved; Desktop Design Approved with documented corrections  
**Language:** English  
**Scope:** MVP, current and previous week only  
**Dependencies:** EPIC-02 Projects, EPIC-03 Goals, EPIC-04 Contributions, EPIC-05 Progress Tracking, EPIC-06 Weekly Focus Planning, EPIC-08 Weekly Reflection

## 1. Purpose and Outcomes

The Alignment Dashboard is the authenticated landing page at `/dashboard`. It answers: **Where did my attention go? Am I aligned with my priorities? What needs my attention?** It compares confirmed Weekly Focus plans against time recorded in Contributions without inventing metrics or equating time spent with goal completion. The Dashboard is analytical and navigational, not a place to edit plans or progress.

The layout follows a single vertically ordered page: **Summary Cards → Attention Comparison → Focus Goals → Insights**. These are sequential sections, not mutually exclusive tabs. The visual direction is a compact, responsive, accessible, Grafana-inspired light interface with white/gray surfaces and orange accents.

## 2. Approved Business Decisions (32)

### Discovery Round 1 (12)

1. After login, open Alignment Dashboard at `/dashboard`.
2. Analytics period selector offers **Current Week** and **Previous Week**.
3. Sections appear in order: Summary Cards, Attention Comparison, Focus Goals, Insights.
4. Automatically refresh data following Contributions, Weekly Plan, or Progress changes and when the Dashboard is reopened.
5. Summary Cards: **Tracked Time**, **Focus Attention %**, **Unplanned Attention %**.
6. Default comparison: **Current Plan vs Actual**; toggle to **Original Plan vs Actual**.
7. Do not calculate a synthetic Alignment Score; show factual deviations.
8. Show deviations in percentage points: **Actual − Planned**.
9. Focus Goals includes all Goals in the selected confirmed snapshot, including Completed and Archived.
10. Insights are deterministic, rule-based, and grounded in real data; no AI-generated insights in MVP.
11. No Weekly Plan: show **No Weekly Plan**, with **Create Weekly Plan** CTA for the current week.
12. No Contributions: show **No Actual Data** rather than misleading zero percentages; preserve Planned Attention.

### Discovery Round 2 (16)

13. Tracked Time sums all Contributions in the selected week, including Unplanned Attention (Goals outside the selected plan version).
14. Focus Attention = time contributed to Goals in the selected Focus snapshot / total tracked time × 100%.
15. Calculate using exact contribution minutes; display Actual percentages and deviations to one decimal place.
16. A planned Goal with zero contributed minutes displays **0.0% Actual** if total tracked time is positive.
17. No confirmed plan but Contributions exist: display Tracked Time and No Weekly Plan; do not calculate Focus/Unplanned percentages or Planned vs Actual.
18. Previous Week without confirmed plan: show No Confirmed Plan and historical Contributions; read-only, no retroactive plan creation.
19. Confirmed plan but no Contributions: Tracked Time = 0h; Focus/Unplanned and deviations = No Actual Data; show Planned values.
20. Neither plan nor Contributions: Empty Dashboard with Create Weekly Plan and Add Contribution only when an eligible Goal exists.
21. Previous Week displays distinct **Past Week — Not Finalized** and **Past Week — Finalized** statuses.
22. Contributions changed before week finalization recalculate Actual and Insights; after finalization historical data are immutable.
23. Original/Current toggle changes the planned baseline; raw contribution minutes and Tracked Time do not change.
24. Without a confirmed plan, disable comparison toggle and display No Confirmed Plan.
25. MVP insights cover Unplanned Attention, Underallocated Plan, Missing Activity, and largest Planned-vs-Actual deviations.
26. A deviation insight requires absolute deviation **≥ 10.0 percentage points**, calculated before display rounding.
27. With No Actual Data, suppress deviation insights; Missing Activity messaging remains possible.
28. Navigation: Focus Goal → Goal Details; Edit Plan → Weekly Focus; Review Week → Weekly Reflection, preserving selected week context.

### Final Discovery (4)

29. Focus membership is **relative to the selected snapshot**. A Goal removed from Current but present in Original counts as Unplanned under Current and as Focus under Original. Reclassify its Contributions when toggling baselines.
30. Compute summary Focus/Unplanned from exact minutes. If independently rounded row percentages add to 99.9% or 100.1%, explain the discrepancy in a tooltip rather than changing underlying values.
31. Display **at most four insights** in this order: Missing Activity → Underallocated Plan → Unplanned Attention → largest absolute deviations.
32. The period is encoded in the URL: `/dashboard?period=current` or `/dashboard?period=previous`. Refresh and browser Back/Forward preserve the selected period.

## 3. Period, Ownership, and Data Sources

- **Current Week** and **Previous Week** are the only selectable periods in MVP; weekly boundaries follow EPIC-06's Monday 00:00 to next Monday 00:00 exclusive and the timezone fixed for each week.
- The selected period is the URL source of truth. Bare `/dashboard` defaults to Current Week; invalid `period` values should safely fall back to Current Week (implementation recommendation).
- Use only persisted Weekly Plan snapshots, Contributions, and Goal/Project data for the authenticated user's authorized workspace. Do not fabricate values in the product UI.
- **Original Plan** is first confirmed Weekly Plan version; **Current Plan** is latest confirmed version for that week. Both are immutable snapshots under EPIC-06.
- An unconfirmed carry-forward Draft is **not** a confirmed plan and must not be used as an analytics baseline.
- Goal completion/archive changes do not remove a Goal from previously confirmed snapshots. Historical Goal labels/statuses remain viewable subject to authorization.
- Goal Progress Events and manual progress percentage do not enter attention calculations. Progress changes can trigger a refresh of Goal presentation only.
- A past week is read-only for Weekly Planning even if not finalized. Contribution changes remain possible only under EPIC-04 rules until Reflection finalization.

## 4. Calculation Specification

Let `W` be the selected week, `C(W)` its Contributions, `M(c)` each Contribution's duration in **integer minutes**, and `S` the set of Goal IDs in the selected confirmed Weekly Plan snapshot (Original or Current).

```text
trackedMinutes = sum(M(c) for c in C(W))
focusMinutes = sum(M(c) for c in C(W) if c.goalId in S)
unplannedMinutes = trackedMinutes - focusMinutes

if confirmedSnapshotExists and trackedMinutes > 0:
    focusAttentionPct = 100 * focusMinutes / trackedMinutes
    unplannedAttentionPct = 100 * unplannedMinutes / trackedMinutes
    actualPct(goal) = 100 * sum(M(c) for c.goalId == goal.id) / trackedMinutes
    deviationPp(goal) = actualPct(goal) - plannedPct(goal, selectedSnapshot)
else:
    focusAttentionPct, unplannedAttentionPct, actualPct, deviationPp = No Actual Data / unavailable
```

**Important:** When no confirmed snapshot exists, Focus/Unplanned are **undefined**, even if Contributions exist; do not label all time Unplanned by default. When a confirmed snapshot exists but trackedMinutes = 0, actual percentages are **No Actual Data**, not zero. When trackedMinutes > 0, a Focus Goal with zero minutes has actual = 0.0%.

Tracked Time is displayed as hours and minutes, e.g. `20h 30m` or `0h 0m`. Calculate with unrounded integer minutes and round **only the display** of percentages and percentage-point deviations to one decimal. Display signed deviations (`+15.0 pp`, `−10.0 pp`, `0.0 pp`). A comparison of 50% Planned to 40% Actual is `−10.0 pp`, **not** −20%.

**Snapshot-relative example:** Original contains Goal A and Goal B; Current contains Goal A only. Goal B's contributed minutes remain in Tracked Time. Under Original they contribute to Focus; under Current they contribute to Unplanned. Thus toggling snapshots may change **Focus Attention**, **Unplanned Attention**, and corresponding insights, but never the raw recorded time.

**Rounding:** Focus and Unplanned summaries are computed directly from precise minute totals; they are complementary before rounding. Independently rounded Goal rows may not sum to the displayed total. Explain with a tooltip: “Percentages are rounded for display; totals are calculated from exact tracked minutes.” Do not distort a Goal's percentage to force the displayed rows to sum to 100.0%.

**Underallocation:** `unallocatedPlannedPct = 100 - sum(plannedPct for goals in selected snapshot)`. A confirmed plan totaling <100% is allowed by EPIC-06 and marked **Needs Review**. This is distinct from Unplanned Attention, which is actual time outside selected Focus Goals. Never equate the two.

## 5. UI and States

### Global Layout

- App shell per the reference mockups (BRD FR-045, D17): sidebar Dashboard, Projects, Goals, Contributions, Weekly Focus, Reflection, Workspace group (Settings, Account); header with EN / УКР toggle and profile menu.
- Header: **Alignment Dashboard**, period toggle (Current Week / Previous Week), visible selected date range, and historical finalization status where applicable. Any ‹ › arrows around the date range only switch between Current and Previous Week (A6). Notification bell, help icon, and "Your Projects" / "Next Steps" panels seen in mockups are not MVP requirements (A7).
- Summary Cards: Tracked Time, Focus Attention, Unplanned Attention; unavailable metrics show `—` / `No Actual Data` rather than fabricated `0%`.
- Attention Comparison: Current Plan (default) / Original Plan toggle; Focus Goal rows with Planned, Actual, and Δ (pp); relevant totals and a rounding explanation tooltip.
- Focus Goals: all Goals in selected snapshot with Project, status, optional manual Progress (distinct from Actual), and navigation to Goal Details.
- Insights: up to four rule-based, actionable messages; only render those supported by data.
- Use accessible text alongside color; Completed/Archived badges remain legible; keyboard-accessible toggles and links; loading/empty/error states should not show stale values as current.

### Empty and Special States

| State | Tracked Time | Focus / Unplanned | Comparison | CTA / Messaging |
|---|---|---|---|---|
| Confirmed plan + Contributions | Sum of all minutes | Computed from selected snapshot | Enabled | Normal Dashboard |
| No confirmed plan + Contributions, current | Sum of all minutes | Unavailable | Disabled | No Weekly Plan; Create Weekly Plan |
| No plan + no Contributions, current | 0h 0m | Unavailable | Disabled | Empty Dashboard; Create Weekly Plan; Add Contribution only with eligible Goal |
| Confirmed plan + no Contributions | 0h 0m | No Actual Data | Planned shown; Actual/Δ unavailable | No Actual Data; Missing Activity may appear |
| No confirmed plan, previous | Historical sum | Unavailable | Disabled | No Confirmed Plan; historical Contributions; no Create Plan |
| Previous Week, not finalized | Historical sum | Computed if eligible | Read-only | Past Week — Not Finalized; Review Week; actual may update |
| Previous Week, finalized | Historical sum | Computed if eligible | Read-only | Past Week — Finalized; locked historical data |

**CTA eligibility correction (Screen 06):** Show **Add Contribution** only if there is an eligible Goal for contribution creation. If none exists, guide the user to create a Project/Goal (e.g., **Create First Project** when no Project exists). The Create Weekly Plan CTA must respect EPIC-06 eligibility; it must not promise a valid plan without selectable Goals.

### Insights Rules

1. **Missing Activity:** Show when a confirmed plan exists but total tracked time is zero; do **not** infer it from Actual < Planned. Do not label a Goal with positive actual minutes as having no activity merely because it underperformed its planned share.
2. **Underallocated Plan:** Show only when total Planned Attention of the selected confirmed snapshot is **<100%**. E.g., 40% + 30% + 20% = 90%, so 10% unallocated. A 100% plan must never show this insight.
3. **Unplanned Attention:** Show when a confirmed snapshot and positive tracked time exist and unplannedMinutes > 0; compute its share from exact minutes.
4. **Deviation Insights:** Only for Goals in selected snapshot with actual data and absolute unrounded deviation ≥10 pp. Rank by largest absolute deviation; display signed direction and both Actual and Planned.
5. **Ordering/cap:** Missing Activity, Underallocated Plan, Unplanned Attention, then deviations in descending absolute magnitude; show at most four messages.
6. **Tie-breaking:** Deterministic selection is required when equal absolute deviations occur. **Implementation recommendation (not separately business-approved):** order by absolute deviation descending, then Goal ID ascending as a stable final tie-breaker. Do not preferentially label a positive or negative deviation as uniquely largest when magnitudes tie without applying the documented rule.
7. With no confirmed plan, do not generate insights implying a Planned baseline. With No Actual Data, suppress actual deviation and unplanned-time insights.

### Auto-refresh and Updated Notice

Refresh or invalidate dashboard data when relevant Contributions, Weekly Plan, or Progress mutations succeed and when the Dashboard is reopened. Changes to Progress update relevant Goal display only; they do not alter tracked time. **Updated** notice is transient and shown only after an actual relevant data recalculation; do not show it on every page visit, reload, or ordinary initial fetch. The exact dismissal duration is an implementation/UI detail, not an approved business requirement.

## 6. User Flows (14)

**AD-01 — Open Dashboard.** Successful login → `/dashboard` → Current Week selected → fetch real data → show sections or applicable empty state.

**AD-02 — Switch Analytics Period.** Select Previous/Current → update `period` query → load correct week and status → Back/Forward/refresh retain selection.

**AD-03 — Current Plan vs Actual.** Open week with confirmed plan → default latest snapshot → calculate Planned, Actual, Focus/Unplanned, and deviations.

**AD-04 — Original Plan vs Actual.** Select Original → use first confirmed snapshot → reclassify Contributions by Original Goal membership → recompute Focus/Unplanned and insights; raw time unchanged.

**AD-05 — View Focus Goals.** Inspect selected snapshot's Goals → see Project, lifecycle status, Planned/Actual and optional independent Progress → Completed/Archived remain visible.

**AD-06 — Review Unplanned Attention.** With confirmed plan and tracked activity → identify time on Goals outside selected snapshot → display percentage and insight if applicable.

**AD-07 — Missing Weekly Plan.** No confirmed plan → show Tracked Time if any → disable comparison and derived Focus/Unplanned → current week offers eligible Create Weekly Plan CTA.

**AD-08 — No Actual Data.** Confirmed plan, zero Contributions → show 0h tracked, Planned values, No Actual Data for ratios and deviations → suppress deviation insights.

**AD-09 — Previous Week Status.** Switch to Previous → show Past Week Not Finalized or Finalized; plan read-only in both → Reflection available where appropriate.

**AD-10 — Refresh After Data Changes.** Save/edit/delete permitted Contributions or confirm plan → recalculate dependent values → show transient Updated notice only following actual recalculation.

**AD-11 — Review Insights.** Evaluate deterministic rules on selected week and snapshot → order by approved priority → show up to four valid insights.

**AD-12 — Open Goal Details.** Select a Focus Goal → navigate to authorized Goal Details without changing plan snapshot.

**AD-13 — Open Weekly Focus.** Select Edit Plan → open `/weekly-focus?week=YYYY-MM-DD` with selected week context; historical planning restrictions still apply.

**AD-14 — Open Weekly Reflection.** Select Review Week → navigate to Reflection with selected week context; Reflection owns manual finalization.

## 7. Acceptance Criteria (Final Consolidation)

### Navigation and Structure

- **AD-AC-01:** Successful login lands on `/dashboard`.
- **AD-AC-02:** Current Week is the default period.
- **AD-AC-03:** User can select Current or Previous Week; the selection is reflected in URL and survives refresh/Back/Forward.
- **AD-AC-04:** Sections appear in order Summary → Comparison → Goals → Insights, not as mutually exclusive tabs.
- **AD-AC-05:** All metrics use real persisted data; no invented Dashboard values.
- **AD-AC-06:** Relevant data refreshes following mutations and Dashboard reopening.
- **AD-AC-07:** Focus Goal links open Goal Details.
- **AD-AC-08:** Edit Plan opens Weekly Focus with selected week context and obeys past-week restrictions.
- **AD-AC-09:** Review Week opens Reflection with selected week context.

### Calculations

- **AD-AC-10:** Tracked Time sums all weekly Contributions, including Unplanned Attention.
- **AD-AC-11:** Focus Attention uses Goals in the **selected confirmed snapshot**, divided by all weekly tracked minutes.
- **AD-AC-12:** Unplanned Attention includes Contributions to Goals outside the **selected confirmed snapshot**.
- **AD-AC-13:** Actual Attention uses exact integer contribution minutes and all-week denominator.
- **AD-AC-14:** Actual percentages and deviations display one decimal place, with precise-minute computation.
- **AD-AC-15:** Deviation is Actual − Planned, measured in percentage points.
- **AD-AC-16:** No synthetic Alignment Score is displayed.
- **AD-AC-17:** A Focus Goal with zero minutes has 0.0% Actual only if total tracked minutes >0.
- **AD-AC-18:** Progress Events do not alter Actual Attention or Tracked Time.

### Plan Comparison

- **AD-AC-19:** Current Plan vs Actual is the default baseline.
- **AD-AC-20:** Original Plan vs Actual is selectable.
- **AD-AC-21:** Switching baselines updates Planned values, snapshot membership, Focus/Unplanned aggregates, Goal rows, and insights; raw Contributions and Tracked Time remain unchanged.
- **AD-AC-22:** All Goals in selected confirmed snapshot remain visible, including Completed/Archived.
- **AD-AC-23:** Planned values derive from immutable selected Weekly Plan version.
- **AD-AC-24:** Without a confirmed plan, comparison is unavailable.

### Empty and Historical States

- **AD-AC-25:** No plan + Contributions shows Tracked Time and No Weekly Plan.
- **AD-AC-26:** No plan leaves Focus/Unplanned percentages and comparisons unavailable.
- **AD-AC-27:** No plan + no Contributions shows Empty Dashboard.
- **AD-AC-28:** Current-week empty state offers a Weekly Focus creation route, subject to Goal eligibility.
- **AD-AC-29:** Add Contribution CTA appears only with an eligible Goal; otherwise offer relevant Project/Goal onboarding.
- **AD-AC-30:** Confirmed plan + no Contributions shows Planned but No Actual Data for Actual, Focus/Unplanned, and Δ.
- **AD-AC-31:** Previous Week without confirmed plan shows historical Contributions and no retrospective Create Plan.
- **AD-AC-32:** Previous Week differentiates Not Finalized and Finalized statuses.
- **AD-AC-33:** Permitted pre-finalization edits to historical Contributions recalculate Actual and Insights.
- **AD-AC-34:** Finalized historical data and resulting analytics remain immutable.

### Insights

- **AD-AC-35:** Insights use deterministic rule-based logic without AI generation.
- **AD-AC-36:** Unplanned Attention insight uses positive time outside selected Focus.
- **AD-AC-37:** Underallocated Plan insight appears only when selected snapshot Planned total <100%.
- **AD-AC-38:** Missing Activity requires a confirmed plan and zero total tracked time; it is not inferred from underperformance.
- **AD-AC-39:** Deviation insights require absolute unrounded difference ≥10 pp.
- **AD-AC-40:** No Actual Data suppresses actual deviation insights; Missing Activity may appear.
- **AD-AC-41:** Insights use the selected Original/Current baseline and reclassification.
- **AD-AC-42:** Insights update after relevant data changes.

### Derived Criteria from Final Discovery and Design Corrections

- **AD-AC-43:** Switching baseline reclassifies a Goal removed from Current but present in Original as Unplanned under Current and Focus under Original.
- **AD-AC-44:** Summary percentages derive from exact minutes; tooltip explains independent display rounding differences.
- **AD-AC-45:** Display no more than four insights, ordered Missing Activity → Underallocated → Unplanned → descending absolute deviations.
- **AD-AC-46:** Equal absolute deviations resolve through a documented deterministic tie-breaker.
- **AD-AC-47:** An `Updated` banner appears only after actual recalculation and is transient, not persistent on reopen.
- **AD-AC-48:** An underallocated sample/state must use mathematically consistent Planned values (e.g., 40% + 30% + 20% = 90%, unallocated 10%).
- **AD-AC-49:** No plan means no Focus/Unplanned classification, even if all recorded Goals might otherwise seem unplanned.
- **AD-AC-50:** Unconfirmed carry-forward Drafts do not count as confirmed analytics plans.

## 8. Desktop UI Design Inventory — All 16 Approved

**Set 1/4 — Default, Comparison, Goals, Insights**

| # | URL | Screen Name | UI State | Approval Notes |
|---|---|---|---|---|
| 01 | `/dashboard?period=current` | Alignment Dashboard | Default Current Week | Approved |
| 02 | `/dashboard?period=current` | Alignment Dashboard | Original vs Actual | Approved; snapshot-relative classification applies |
| 03 | `/dashboard?period=current` | Alignment Dashboard | Focus Goals Overview | Approved; include Completed/Archived |
| 04 | `/dashboard?period=current` | Alignment Dashboard | Rule-based Insights | Approved with corrections: underallocation only if Planned <100; Missing Activity not inferred from low Actual; deterministic largest deviation; sequential page sections |

> **Mockup status (2026-11-09):** no valid mockup exists for Set 2/4 (states 05–08) or Set 3/4 (states 09–12). Implement them from this table and the epic text only. `Archipelago Analytics Dashboard States.png` (a separate Analytics page) is out of scope and must not be used.

**Set 2/4 — Empty States and Unplanned Attention**

| # | URL | Screen Name | UI State | Approval Notes |
|---|---|---|---|---|
| 05 | `/dashboard?period=current` | Alignment Dashboard | No Weekly Plan + Activity | Approved |
| 06 | `/dashboard?period=current` | Alignment Dashboard | Empty Dashboard | Approved; Add Contribution only if eligible Goal; otherwise onboarding CTA |
| 07 | `/dashboard?period=current` | Alignment Dashboard | Plan + No Actual Data | Approved |
| 08 | `/dashboard?period=current` | Alignment Dashboard | Unplanned Attention | Approved |

**Set 3/4 — Historical Week** (illustrative selected week Nov 2–8, 2026)

| # | URL | Screen Name | UI State | Approval Notes |
|---|---|---|---|---|
| 09 | `/dashboard?period=previous` | Alignment Dashboard | Previous Week — Not Finalized | Approved; plan read-only, Contributions may change |
| 10 | `/dashboard?period=previous` | Alignment Dashboard | Previous Week — Finalized | Approved; historical data locked |
| 11 | `/dashboard?period=previous` | Alignment Dashboard | Previous Week — No Confirmed Plan | Approved; no retroactive plan creation |
| 12 | `/dashboard?period=previous` | Alignment Dashboard | Previous Week — Updated Actual | Approved; Updated notice only immediately after actual recalculation |

**Set 4/4 — Deviations, Underallocation, Refresh**

| # | URL | Screen Name | UI State | Approval Notes |
|---|---|---|---|---|
| 13 | `/dashboard?period=current` | Alignment Dashboard | Significant Negative Deviation | Approved; absolute deviation ≥10 pp |
| 14 | `/dashboard?period=current` | Alignment Dashboard | Significant Positive Deviation | Approved; deterministic tie-breaker for equal absolute deviation |
| 15 | `/dashboard?period=current` | Alignment Dashboard | Underallocated Plan | Approved with correction: Planned rows must total 90% in illustrative example, not 100% |
| 16 | `/dashboard?period=current` | Alignment Dashboard | Auto-refresh / Updated Data | Approved; transient notice only following recalculation |

All UI values in mockups are **illustrative**, not user data. The approved business rules and mathematical formulas take precedence over any visual-generation inconsistencies.

## 9. Cross-Epic Integration

- **EPIC-02 Projects:** Project labels and priority may appear in Goal context. Project archive status must not erase a Goal from a historical confirmed snapshot.
- **EPIC-03 Goals:** Active, Completed, and Archived Goals remain visible where included in selected plan snapshot; navigation respects access control. Goal Progress is a separate manual metric.
- **EPIC-04 Contributions:** Sole source for tracked minutes and actual attention. Edits/deletes before week finalization recalculate Dashboard. Date/week attribution and archived/completed Goal restrictions follow EPIC-04.
- **EPIC-05 Progress Tracking:** Progress Events may change displayed Goal progress/status but do not change attention denominators, plan snapshots, or Actual percentages.
- **EPIC-06 Weekly Focus:** Source of Original/Current immutable plan versions and Focus membership. Draft carry-forward does not count. Current/Previous selection and snapshots must respect fixed week timezone. Underallocated Planned Attention is permitted and marked Needs Review.
- **EPIC-08 Weekly Reflection:** Owns manual week finalization. Previous Week Not Finalized permits eligible Contribution corrections; Finalized locks history. Review Week navigates to Reflection. A week may be finalized without a confirmed plan.

## 10. Edge Cases and Test Scenarios

1. A Goal is in Original but removed from Current; verify that switching comparison changes Focus/Unplanned while total minutes remain constant.
2. A Goal was added only in Current; under Original its Contributions count as Unplanned, under Current as Focus.
3. A Goal is Completed or Archived after plan confirmation; keep it in relevant historical snapshot.
4. A Goal has 0 minutes while another Goal has activity; show 0.0% Actual for that Goal.
5. No Contributions anywhere in selected week; do not divide by zero or display 0% Actual.
6. No confirmed plan but positive tracked time; never claim 100% Unplanned by default.
7. Previous Week is calendar-past but not finalized; planning remains read-only while eligible Contributions can still change.
8. Week finalized with no confirmed plan; show No Confirmed Plan and immutable historical Contributions.
9. Independently rounded Goal shares sum to 99.9% or 100.1%; tooltip explains totals from exact minutes.
10. Planned totals of 90%, 100%, and (invalid) >100%; Underallocated insight only for valid <100% confirmed snapshots.
11. Deviation at exactly 10.0 pp qualifies; 9.99 pp does not, regardless of rounded presentation.
12. Equal +15 pp and −15 pp deviations; deterministic tie-breaker selects one consistently.
13. More than four valid insights; only first four by approved ordering are shown.
14. Changes to Progress without Contributions do not change Actual Attention.
15. A browser reload or normal navigation does not create a false Updated notice.
16. `period=previous` persists on refresh and Back/Forward; malformed query falls back safely.
17. User has no Project/Goal; show relevant onboarding CTA rather than invalid Add Contribution.
18. Contribution edits move time between Goals or weeks; recompute only affected, still-editable weeks, honoring EPIC-04 and finalization constraints.
19. Zero-minute contributions are invalid under EPIC-04; aggregation assumes validated records.
20. Date ranges and timezones use the fixed week timezone, not an ad hoc client clock conversion.

## 11. Implementation Recommendations (Not Additional Approved Business Rules)

- Expose a single authorized Dashboard read model keyed by workspace/user, week start, selected snapshot, and a data version; server determines week boundaries and finalization state.
- Aggregate minutes in the backend or a well-tested shared service; avoid client-only floating-point accumulation and avoid rounding intermediate ratios.
- Keep immutable plan snapshots separate from live Contribution aggregates; cache invalidation should follow confirmed plan mutations, Contribution mutations, and Goal presentation updates.
- Prefer query-parameter-driven period state and a separate local Original/Current toggle; changing periods should select Current by default unless explicitly specified by a later product decision.
- Implement a documented stable tie-breaker for equal deviations (e.g., Goal ID ascending), with tests.
- Ensure transient Updated notification follows a real successful data refresh and is not shown for initial load.
- Include loading, permission-denied, and recoverable server-error states; do not misrepresent a failed fetch as No Actual Data.
- Use semantic tables, accessible focus states, readable status labels, and responsive stacking of cards/sections.
- Test minute-based calculations with exact boundary timestamps and week-specific timezones; respect authorization for every Goal and Contribution.

## 12. Definition of Done / QA Checklist

- [ ] All 32 approved business decisions implemented.
- [ ] All 14 user flows exercised, including URL navigation and historical states.
- [ ] All 50 consolidated acceptance criteria pass (42 initial + 8 derived corrections/clarifications).
- [ ] All 16 approved UI states implemented with documented corrections.
- [ ] Snapshot-relative Focus/Unplanned classification verified for Original and Current.
- [ ] Calculations use exact minutes; zero denominator and rounding cases covered.
- [ ] No plan, no activity, and no actual data have distinct, truthful UI states.
- [ ] Previous Week Not Finalized and Finalized behave differently as specified.
- [ ] Insights obey threshold, priority, cap, and deterministic tie-breaking.
- [ ] Automatic refresh and transient Updated notification tested.
- [ ] Cross-epic constraints, authorization, accessibility, and responsive layouts tested.
- [ ] No fabricated production metrics or synthetic Alignment Score.

## 13. Approval Record and Scope Boundary

**Approved:** Discovery Round 1 (12), Discovery Round 2 (16), Final Discovery (4), and desktop Sets 1–4 (16 states) with corrections documented above. The 14 flows and original 42 acceptance criteria were reviewed as drafts during Discovery; this final document consolidates them and adds eight derived criteria reflecting approved corrections. Technical recommendations are explicitly nonbinding until adopted during engineering design.

**Out of scope for EPIC-07 MVP:** analytics beyond current/previous week, AI-generated insights, predictive productivity scores, retrospective creation of Weekly Plans, editing Contributions or plans directly within Dashboard, and using manual Goal Progress as a proxy for time-based Actual Attention.


## Shared MVP mobile release gate (BRD NFR-006, D9)

Responsive web, no native app. The Dashboard must be fully usable at 360 px width; no screen has horizontal page scroll at 360 px. Desktop mockups stay the visual reference; no separate mobile mockups are required.

## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Canonical sidebar order incl. Settings | A3, C12 |
| Sidebar/header replaced by the reference app shell | D17 |
| Date arrows limited to Current/Previous; unspecified mockup elements out of scope | A6, A7, C19, C20 |
| 2026-11-10: "outside Focus" → Unplanned Attention; mobile release gate | C9, D9 (NFR-006) |
