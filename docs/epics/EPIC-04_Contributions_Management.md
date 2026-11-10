# EPIC-04 — Contributions Management

**Project:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-04-contributions/`](../design/mockups/epic-04-contributions/) — index with sources and corrections: [design/README.md](../design/README.md#epic-04--contributions)  
**Language:** English  
**Status:** Final product specification — Discovery and Desktop Design approved  
**Scope:** MVP

## 1. Purpose

Enable users to record time actually spent working toward Goals. Contributions are dated time entries used to calculate actual attention for weekly planning, reflection, and alignment. They are **not** manual Goal progress updates.

### In scope
- Create, list, filter, edit, and delete Contributions.
- Historical entries and historical Goal-state eligibility.
- Immutable finalized weeks and controlled cross-week date changes.
- Duration aggregates, warnings, lifecycle restrictions, and clear feedback.
- Create Contribution from the Contributions List or Goal Details.

### Out of scope
- Automatic progress percentage changes based on time.
- Deleting or modifying Progress Events as a side effect of Contribution operations.
- Dedicated Contribution Details, Create, or Edit pages.
- Future-dated Contributions, bulk entry, timers, and automated time tracking.
- Moving an existing Contribution to a different Goal.

## 2. Approved Contribution Model

| Field | Requirement |
|---|---|
| `id` | Stable identifier; implementation-defined type. |
| `goalId` | Required Goal reference; immutable after creation. |
| `date` | Required calendar date, interpreted under the relevant weekly timezone rules; cannot be in the future. |
| `durationMinutes` | Required integer, 1–1440 inclusive. |
| `note` | Optional, maximum 500 characters. |
| Audit metadata | Creation/update timestamps and actor/Workspace linkage as needed by architecture; implementation details TBD. |

Project is derived through the Goal; the UI displays it but a Contribution does not change Project independently. An individual Contribution is limited to 24 hours. Multiple Contributions for the same Goal on the same date are permitted. The total across Contributions on one calendar day may exceed 24 hours; display a warning, **do not block saving**.

### Duration UI
- Two numeric inputs: **Hours** (0–24) and **Minutes** (0–59).
- Convert to total minutes and validate `1 <= total <= 1440`.
- `24h 00m` is valid; `24h 01m` and `0h 00m` are invalid.
- Edit prepopulates both inputs from the stored duration.

## 3. Goal and Project Eligibility

All mutations are authorized and validated server-side; disabled UI actions are not sufficient enforcement.

### Create
- The current parent Project must be **Active** (not Archived).
- The current Goal must be **Active** (not Completed or Archived).
- A currently Completed Goal must first be **Reopened**, even when it was Active on the selected historical date.
- For a Contribution date **on or after Goal creation**, the Goal must have been **Active and not Archived** during at least part of the selected date.
- **Approved pre-creation backfill exception:** A Contribution date **before Goal creation** is permitted without requiring the Goal to have existed or been Active on that historical date. The current Goal and Project must both be Active, the target week must be unfinalized, the date must not be in the future, and all normal field/duration validation applies. Never reject solely because `date < goal.createdAt`.
- The target week must be unfinalized.

### Edit
- Goal ID is immutable; only Date, Duration, and Note may change.
- Current Archived Goal or Archived Project blocks editing until the appropriate Restore action.
- Both the source week and destination week must be unfinalized (including when the edit crosses weeks).
- Date eligibility must be revalidated on Save using the same pre-creation exception and post-creation historical rules as Create, alongside current Goal/Project status.
- If a target week is finalized, reject the entire update; the original record stays unchanged.

### Delete
- Requires confirmation.
- Block if the Contribution week is finalized.
- Block if its current Goal or Project is Archived; Restore first.
- On success, remove the Contribution and recalculate affected duration aggregates; **Progress Events remain unchanged**.

### Restoring archived entities
- If only Goal is Archived: show **Restore Goal**.
- If Project is Archived: show **Restore Project** first.
- If both are Archived: Restore Project, then Restore Goal.
- Restoration never makes a finalized Contribution mutable.

## 4. Historical Dates, Weekly Finalization, and Timezones

1. The default Create date is **Today** in the user's profile timezone.
2. Future dates are prohibited and show an inline validation error.
3. Historical entries may be added to earlier weeks only when those weeks are not finalized.
4. Weekly finalization is initiated by the user during Reflection; it is never automatic.
5. Once a week is finalized, all its Contributions are read-only: no Edit or Delete.
6. Cross-week Date changes require **both** source and destination weeks to be open.
7. Week boundaries are determined using the timezone fixed for each respective week; changing profile timezone affects future weeks only and never migrates historical Contributions between weeks.
8. For dates on/after Goal creation, historical Goal lifecycle eligibility applies alongside current-state restrictions. For dates before Goal creation, waive only the historical Active-on-date requirement; current Goal/Project Active status and all other checks remain mandatory.
9. The backend must handle concurrent finalization and mutations atomically so a finalized week cannot be modified by a race condition.

**Approved inline error messages / reasons** (copy may be polished without changing meaning):
- `Week finalized`
- `Goal was not active on this date`
- `Future dates are not allowed`

Other failures should give actionable messages without exposing internal details.

## 5. Routes and Filtering Contract

### Routes
- `/contributions` — Contributions List and its Create/Edit/Delete dialogs.
- `/goals/[id]` — Goal Details; **Add Contribution** opens a dialog with Goal preselected.
- No `/contributions/create`, `/contributions/[id]`, or `/contributions/[id]/edit` page in MVP.

### Proposed and design-aligned URL query parameters

| Parameter | Meaning | Example |
|---|---|---|
| `from` | Start date, inclusive | `2026-11-01` |
| `to` | End date, inclusive | `2026-11-09` |
| `projectId` | Project filter | `123` |
| `goalId` | Goal filter | `456` |

Example: `/contributions?from=2026-11-01&to=2026-11-09&projectId=123&goalId=456`

- Date Range, Project, and Goal filters are combinable.
- URL query parameters are the source of truth for filter state.
- Update filters client-side without a full reload; Refresh and Back/Forward restore them.
- **Clear Filters** removes filter parameters.
- Handle invalid or inconsistent parameters gracefully.
- TanStack Query keys include normalized filters.
- Default sort is Contribution Date descending (newest first). A deterministic tie-breaker is an implementation choice.
- Without date parameters the list shows the **current week** (Monday–Sunday in the profile timezone); 25 rows per page (D15). The mockup preset "Last 7 days" is superseded.

**Implementation detail to finalize:** exact normalization of invalid values and the pagination mechanism (page size 25 is approved, D15).

## 6. List and Dialog UX

### Contributions List
Columns: **Date | Goal | Project | Duration | Note | Actions**. Show relevant Edit/Delete actions only when eligible. Provide Empty, Loading, and Server Error states, with retry on load error.

### Create Contribution dialog
- Required: Goal, Date, Duration (Hours and Minutes).
- Optional: Note, up to 500 characters.
- Date defaults to Today in profile timezone.
- From Goal Details, Goal is preselected.
- Save validates fields, date, week status, current Goal/Project status and applicable historical eligibility (with the pre-creation exception).
- If daily aggregate exceeds 24 hours, display a warning but permit Save.
- On success: close dialog, remain on originating page, refresh relevant data, show success notification.
- On server error: keep dialog open, preserve entered data, show an error message.

### Edit Contribution dialog
- Prepopulate existing Goal (read-only), Date, Hours, Minutes, Note.
- Validate source and target week finalization and historical date eligibility.
- Show explanatory state when changing Date crosses weeks.
- On failure, preserve original persisted record and dialog input; show error.

### Delete Contribution dialog
- Explicit confirmation before deletion.
- Explain that deleting the Contribution updates time aggregates **but does not alter Progress Events** (the mockup copy "This action cannot be undone" alone is insufficient).
- On server failure, keep dialog open and show error.

## 7. User Flows

### CF-01 — Create from Contributions List
1. Open `/contributions`.
2. Select **Add Contribution**.
3. Choose eligible Goal, Date, Hours/Minutes, and optional Note.
4. Validate all rules; display warnings or inline errors.
5. Save; remain on List and show success notification.

### CF-02 — Create from Goal Details
1. Open `/goals/[id]`.
2. Select **Add Contribution**.
3. Dialog opens with Goal preselected.
4. Enter remaining fields and Save.
5. Remain on Goal Details; refresh relevant aggregates.

### CF-03 — Browse and Filter
1. Open `/contributions`.
2. Apply Date Range, Project, and/or Goal.
3. Update URL and list without full reload.
4. Support browser history, refresh, and Clear Filters.

### CF-04 — Edit Contribution
1. Select an editable Contribution.
2. Open prefilled Edit dialog.
3. Change Date, Duration, or Note; Goal remains locked.
4. Validate both weeks, historical date, and entity restrictions.
5. Save atomically and update aggregates; otherwise retain data and show error.

### CF-05 — Delete Contribution
1. Select Delete on an eligible record.
2. Show confirmation explaining time aggregate and Progress Event effects.
3. Confirm; delete and recalculate aggregates.
4. Show success or preserve dialog with error.

### CF-06 — Add Historical Contribution
1. Choose an earlier date, including a prior week or a date before Goal creation.
2. Check that week is open and current Goal/Project are Active; for dates on/after Goal creation check historical Active-on-date eligibility, but for earlier dates apply the approved exception.
3. Save or show a specific validation reason.

### CF-07 — Change Date Across Weeks
1. Open Edit and choose a date in a different week.
2. Verify source and destination weeks are both unfinalized.
3. If eligible, save and refresh both weeks' aggregates.
4. If not, reject the update and preserve the original Contribution.

### CF-08 — View Finalized Contributions
1. Open a period containing finalized Contributions.
2. Show entries with **Finalized / Read-only** indication.
3. Disable or omit Edit/Delete; backend rejects any attempted mutation.

## 8. Acceptance Criteria

### Create and validation
- **CON-AC-01:** Authorized user can create a Contribution for an eligible Goal.
- **CON-AC-02:** Goal, Date, and Duration are required.
- **CON-AC-03:** Hours accepts 0–24 and Minutes 0–59.
- **CON-AC-04:** Total Duration must be 1–1440 minutes; `24h 00m` valid, `24h 01m` and `0h 00m` invalid.
- **CON-AC-05:** Note is optional, maximum 500 characters.
- **CON-AC-06:** Default Date is Today in the user's timezone.
- **CON-AC-07:** Future dates are rejected with inline validation.
- **CON-AC-08:** Multiple Contributions for one Goal on one day are allowed.
- **CON-AC-09:** Daily aggregate over 24 hours triggers warning without blocking Save.
- **CON-AC-10:** Create server error preserves dialog and input and displays an error.
- **CON-AC-11:** Successful Create stays on originating page and shows success feedback.

### Historical entries and finalization
- **CON-AC-12:** Historical Contributions are allowed only in unfinalized weeks.
- **CON-AC-13:** A Contribution dated before Goal creation is allowed when the current Goal and Project are Active, the target week is unfinalized, the date is not future, and normal validation passes; historical Active-on-date is explicitly waived for this case.
- **CON-AC-14:** For dates on/after Goal creation, Goal must have been Active and not Archived during some part of the selected date; for pre-creation dates, CON-AC-13 takes precedence.
- **CON-AC-15:** Currently Completed Goal must be Reopened before new historical or current Contributions.
- **CON-AC-16:** Currently Archived Goal or Project blocks creation.
- **CON-AC-17:** Creation in a finalized week is rejected.
- **CON-AC-18:** Finalized Contributions are read-only and cannot be edited or deleted.
- **CON-AC-19:** Cross-week Date changes require both weeks to be unfinalized.
- **CON-AC-20:** A finalized destination week causes an atomic rejection; original record is unchanged.
- **CON-AC-21:** Each historical week retains its fixed timezone and boundaries.
- **CON-AC-22:** Profile timezone changes do not migrate historical Contributions.

### Edit, delete, and lifecycle
- **CON-AC-23:** Edit dialog is prefilled with stored values.
- **CON-AC-24:** Goal is immutable after Contribution creation.
- **CON-AC-25:** Eligible edits can modify Date, Duration, and Note.
- **CON-AC-26:** Current Archived Goal or Project blocks Edit and Delete until restored.
- **CON-AC-27:** If both Project and Goal are Archived, Project must be restored first.
- **CON-AC-28:** Restoring an entity never unlocks a finalized Contribution.
- **CON-AC-29:** Delete requires confirmation explaining effects on aggregates and Progress Events.
- **CON-AC-30:** Successful Delete updates affected time aggregates.
- **CON-AC-31:** Delete does not delete or modify manual Progress Events.
- **CON-AC-32:** Edit/Delete server failures preserve dialog context/input and show an error.

### List, filters, and security
- **CON-AC-33:** List shows Date, Goal, Project, Duration, Note, Actions.
- **CON-AC-34:** Default sorting is Date descending.
- **CON-AC-35:** Date Range, Project, and Goal filters are combinable.
- **CON-AC-36:** Filters are represented by URL query parameters.
- **CON-AC-37:** Refresh and Back/Forward restore filters.
- **CON-AC-38:** Clear Filters removes filtering parameters.
- **CON-AC-39:** TanStack Query cache keys include normalized filters.
- **CON-AC-40:** Backend validates Workspace access, lifecycle restrictions, dates, duration, and week finalization independently of UI.
- **CON-AC-41:** Concurrent finalization and Contribution mutations cannot alter finalized history.
- **CON-AC-42:** Empty, Loading, and Server Error list states are supported.

## 9. Approved Desktop UI States

Every desktop mockup uses Archipelago's **light white/gray theme with orange accents**, and displays **URL, Screen Name, and UI State**.

| # | Screen Name | URL | UI State |
|---|---|---|---|
| 1 | Contributions List | `/contributions` | Default |
| 2 | Contributions List | `/contributions?from=...&to=...&projectId=...` | Filtered |
| 3 | Contributions List | `/contributions` | Empty |
| 4 | Contributions List | `/contributions` | Loading |
| 5 | Contributions List | `/contributions` | Server Error |
| 6 | Create Contribution | `/contributions` | Dialog Default |
| 7 | Create Contribution from Goal | `/goals/[id]` | Goal Preselected |
| 8 | Create Contribution | `/contributions` | Validation Error |
| 9 | Create Contribution | `/contributions` | Daily Total >24h Warning |
| 10 | Edit Contribution | `/contributions` | Dialog Prefilled |
| 11 | Edit Contribution | `/contributions` | Cross-Week Change |
| 12 | Edit Contribution | `/contributions` | Finalized Target Week Error |
| 13 | Delete Contribution | `/contributions` | Confirmation Dialog |
| 14 | Contribution Row | `/contributions` | Finalized / Read-only |
| 15 | Contribution Row | `/contributions` | Archived Goal / Project Restriction |
| 16 | Contributions Feedback | `/contributions` | Success / Server Error Notifications |

**Approved design refinements:** numeric Hours/Minutes inputs and strict 24-hour boundary; specific historical-date errors; contextual Restore Goal/Restore Project action (Project first if both archived); Delete confirmation explicitly preserves Progress Events.

## 10. Cross-Epic Integration

### EPIC-02 — Projects Management
- Project archive blocks Contribution creation, editing, and deletion through its Goals.
- Restore Project does not change existing Contributions or independently archived Goals.

### EPIC-03 — Goals Management
- Goal status Active/Completed and independent archive flag govern eligibility.
- Completed Goal must be Reopened for new Contributions; Archived Goal must be Restored.
- Goal ID is fixed for each Contribution; Project is derived from Goal.

### EPIC-05 — Progress Tracking
- Contribution time and manual Goal percentage progress are separate.
- Contribution deletion or duration changes never automatically modify Progress Events.

### EPIC-06 — Weekly Focus Planning
- Contributions feed Actual Attention calculations.
- Changing Contributions in open weeks updates current aggregates, not stored Original Plan or plan versions.

### EPIC-08 — Weekly Reflection & Finalization
- Reflection finalization freezes Contributions for that week.
- Source and destination week checks protect cross-week edits.
- Fixed per-week timezone protects historical periods.

## 11. Architecture and Data Integrity Notes

- NestJS API is the authority for validation, authorization, lifecycle, and finalization rules; Next.js is a thin BFF.
- Persist duration in integer minutes, not floating-point hours.
- Scope Contribution access to the authorized Workspace and Goal/Project hierarchy.
- Perform mutations and affected aggregate updates consistently; choose transaction/recalculation strategy during implementation.
- Preserve auditability of historical Goal state and archive transitions so date-specific eligibility can be evaluated, including the approved pre-creation backdating exception.
- Ensure finalization checks and mutations are serialized or otherwise protected from races.
- Do not mutate finalized Reflection snapshots or plan versions when open-week Contributions change.
- Expose typed contracts for Contribution mutations, filter parameters, and validation errors.

## 12. QA Checklist

- [ ] Create with 1 minute and with exactly 24h 00m.
- [ ] Reject 0 minutes, 24h 01m, invalid Hours/Minutes, and Note >500 characters.
- [ ] Reject future date; Today resolves in user timezone.
- [ ] Allow multiple same-Goal, same-date entries.
- [ ] Warn but permit daily aggregate >24h.
- [ ] Allow pre-Goal-creation backfill with Active current Goal/Project and open week; do not require historical Active-on-date for pre-creation dates.
- [ ] For on/after-creation dates, reject historically inactive/archived Goal; honor active-any-part-of-day rule.
- [ ] Require Reopen for currently Completed Goal.
- [ ] Block Create for currently Archived Goal or Project.
- [ ] Block Edit/Delete for Archived Goal or Project; restore in correct order.
- [ ] Block all mutations in finalized weeks.
- [ ] Allow cross-week edit only when both weeks open; reject atomically otherwise.
- [ ] Preserve historical weeks when profile timezone changes.
- [ ] Confirm Delete, recalculate duration, retain Progress Events.
- [ ] Preserve form values on mutation failure.
- [ ] Verify URL filters, refresh, Back/Forward, Clear Filters, and query cache keys.
- [ ] Verify Empty/Loading/Error states and access isolation.
- [ ] Test mutation vs finalization concurrency.

## 13. Implementation Questions (Not New Product Decisions)

These details were not explicitly settled by Discovery and must not be presented as approved behavior:

1. ~~Date-filter default and page size~~ — resolved: current week, 25 rows (D15); deterministic same-date tie-breaker remains technical.
2. Exact handling/normalization of malformed query parameters and `from > to`.
3. Storage and query design for Goal lifecycle history and active-any-part-of-day semantics on/after Goal creation; the pre-creation exception is an approved business rule, not an open decision.
4. Precise timezone resolution when a Contribution's Date is edited between weeks with different fixed timezones.
5. Aggregate update mechanism, indexing, and API error-code taxonomy.
6. Whether Completed Goal metadata and existing Contribution edits have additional constraints beyond the expressly approved rules; do not infer new prohibitions.

## 14. Definition of Done

EPIC-04 is complete when all approved User Flows and Acceptance Criteria are implemented and tested; all 16 approved desktop UI states and four refinements are represented; server-side lifecycle/finalization/security checks are enforced; cross-epic aggregate behavior is consistent; and no Contribution operation mutates manual Progress Events or finalized historical records.


## Shared MVP mobile release gate (BRD NFR-006, D9)

Responsive web, no native app. Add Contribution (dialog and save) must be fully usable at 360 px width; no screen has horizontal page scroll at 360 px. Desktop mockups stay the visual reference; no separate mobile mockups are required.

## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Default list range = current week, 25 rows per page; question 1 closed | D15 (Q16) |
| Delete dialog must mention Progress Events (mockup copy insufficient) | S14 review |
| 2026-11-10: mobile release gate for Add Contribution | D9 (NFR-006) |
