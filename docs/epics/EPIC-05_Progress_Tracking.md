# EPIC-05 — Progress Tracking

**Project:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-05-progress/`](../design/mockups/epic-05-progress/) — index with sources and corrections: [design/README.md](../design/README.md#epic-05--progress-tracking)  
**Specification language:** English  
**Status:** Product Discovery and Desktop Design Approved  
**Scope:** MVP  
**Primary route:** `/goals/[id]`

## 1. Purpose

Enable users to track a Goal's completion percentage manually, maintain an immutable chronological audit trail of progress changes, and distinguish outcome progress from time spent on Contributions.

### In scope
- Manual absolute percentage updates for eligible Goals.
- Immutable Progress Events with server-assigned timestamps.
- Progress History displayed as a section of Goal Details.
- Goal lifecycle and weekly-finalization restrictions.
- Optimistic concurrency handling, validation, success/error states.

### Out of scope
- Automatic progress calculation from Contributions or time spent.
- Backdated, edited, or deleted Progress Events. There is no Effective Date field; PRD v1.1 §8 "Effective Date" wording is superseded (D1).
- Creating Progress Events from Contributions (D1).
- Separate `/progress` page or progress-edit route.
- Automatic completion when progress reaches 100%.
- Changing Weekly Focus or Expected Attention when progress changes.

## 2. Approved Domain Rules

### 2.1 Current Goal Progress
1. A newly created Goal starts with `progress = 0`.
2. Progress is an **absolute integer percentage**, inclusive range **0–100**.
3. A user may increase or decrease progress; decreases do not require confirmation.
4. Active Goals may remain at 100%, and may subsequently decrease from 100%.
5. Saving the same percentage is disabled and does not create an Event.
6. A Goal becomes Completed only through the separate **Mark as Completed** action with confirmation (owned by EPIC-03).
7. A Completed Goal's progress is locked until **Reopen Goal**. Reopening preserves the current percentage and does not create a Progress Event.
8. Archived Goals and Goals whose parent Project is archived are read-only for progress changes. Restore the relevant entity first; if both are archived, restore the Project before the Goal.
9. Progress is independent of Contributions. Creating, editing, or deleting Contributions never automatically modifies Goal progress or Progress Events.

### 2.2 Progress Event
Each successful change produces exactly one immutable Progress Event containing:

| Field | Meaning |
|---|---|
| Goal reference | Goal whose progress was changed |
| Previous percentage | Value before the successful change |
| New percentage | Absolute value after the successful change |
| Timestamp | Actual server-side save time |
| Note | Optional user comment, maximum 500 characters |

- Events cannot be backdated, edited, or deleted.
- Corrections are recorded by appending another Event with a new absolute progress value.
- No Event is created for unchanged values, failed saves, or Reopen Goal.
- Event history is ordered **newest first** and displays Date/Time, Previous %, New %, signed Change (+/−), and Note.
- Progress History is a **section on Goal Details**, **not a separate tab or page**.
- Initially display the **latest 10 Events**. **Load More** progressively retrieves older Events; any “Showing X of Y” count must match the actual displayed entries.

### 2.3 Weekly Finalization and Timezone
1. Each Progress Event belongs to the week containing its actual server timestamp, interpreted using the timezone fixed for that week.
2. A finalized week's Events remain immutable and viewable. The only exception is self-service account deletion (BRD FR-046, BR-029), which removes all of the user's data.
3. Finalization of a previous week does not prevent a new update in the **current open week**.
4. The current week can never be finalized (EPIC-08 D01); as a defensive measure the backend still rejects any Event whose server-timestamp week is finalized (C14).
5. Weekly starting progress is the most recent progress value recorded **before** the week begins, or 0% if none exists. Computing this baseline does not create an Event.
6. Profile timezone changes do not reassign historical Events to other weeks.
7. Mark **only Events from finalized weeks** as `Finalized`; newer Events in open weeks are not marked finalized. Avoid an inaccurate global “Week finalized” label for a mixed history.
8. Finalizing a week does not rewrite previous Events or retroactively change saved Weekly Plans/Reflections.

## 3. User Interface Contract

### 3.1 Goal Details (`/goals/[id]`)
- Show current percentage and progress bar.
- Eligible Active Goal: show **Update Progress** action.
- Active Goal at 100%: keep **Update Progress** available and separately offer **Mark as Completed**.
- Completed Goal: show read-only progress and **Reopen Goal**.
- Archived Goal: show read-only progress and **Restore Goal** (subject to parent Project state).
- Archived parent Project: show read-only progress and **Restore Project**.
- Show **Progress History** as a section of Goal Details; it is not a dedicated navigation tab.
- Empty history: explanatory empty state and Update Progress action when Goal is eligible.

### 3.2 Update Progress Dialog
- Opens on Goal Details without changing the URL.
- Shows Goal identity and current percentage.
- A slider (0–100) and numeric input are synchronized for valid values.
- Numeric input accepts only whole-number percentages 0–100; invalid, fractional, nonnumeric and out-of-range input produces an inline error.
- For invalid typed values such as `105`, the numeric field shows the invalid input/error while the slider remains within its valid 0–100 range; do not render the slider beyond 100.
- Optional Note with a 500-character maximum and visible length feedback.
- **Save Progress** disabled for invalid or unchanged values.
- On successful Save: close dialog, update current progress and history without full-page reload, show success toast.
- On server error: keep dialog open, preserve entered percentage and Note, show error with retry available.

### 3.3 Concurrent Update Conflict
- If another tab/session changed the Goal after the dialog opened, reject the stale Save; do not silently overwrite.
- Show the current server percentage and a **Reload Current Progress** action.
- While stale, **Save Progress** is disabled.
- After reload, synchronize the dialog with the latest version; the user can choose a new value and save again.
- The backend is authoritative for concurrency and Goal lifecycle eligibility.

## 4. User Flows

### PF-01 — Update Goal Progress
1. Open eligible Goal Details at `/goals/[id]`.
2. Select **Update Progress**.
3. Set new absolute percentage using slider or numeric input; optionally enter Note.
4. Validate and Save.
5. Backend atomically updates Goal progress and appends one Event.
6. Dialog closes; progress/history refresh without page reload; success toast appears.

### PF-02 — Decrease Progress
1. Open Update Progress dialog on an Active Goal.
2. Choose a lower valid value.
3. Save without additional confirmation.
4. Append Event with negative signed delta.

### PF-03 — Reach 100%
1. Update an Active Goal to 100%.
2. Goal remains Active and the update is recorded.
3. Display independent **Mark as Completed** action.
4. Completion requires its own confirmation; it is not triggered by saving 100%.

### PF-04 — View Progress History
1. Open Goal Details.
2. View Progress History section with latest 10 Events newest first.
3. Read timestamp, previous/new values, signed delta, Note and per-Event Finalized status.
4. Select **Load More** to fetch older Events.

### PF-05 — Correct Earlier Progress
1. Open Update Progress dialog.
2. Enter a corrected absolute percentage.
3. Save; append a new Event while leaving all previous Events unchanged.

### PF-06 — Concurrent Update
1. Open dialog with a known current progress/version.
2. Another client updates the Goal.
3. Attempted Save is rejected as stale.
4. Show current server percentage; disable Save.
5. Select **Reload Current Progress**, review latest value, re-enter desired value and retry.

### PF-07 — Completed Goal
1. Open Completed Goal Details.
2. Progress is read-only; Update unavailable.
3. Select **Reopen Goal** through EPIC-03 flow.
4. Progress value remains unchanged; no Event is generated.
5. Progress editing becomes available if the Goal/Project is otherwise eligible.

### PF-08 — Archived Restriction
1. Open Goal Details for an archived Goal or a Goal under an archived Project.
2. Progress is read-only.
3. Restore the Project first if archived; then restore Goal if separately archived.
4. Eligible Active Goal can subsequently update progress.

### PF-09 — Update After Previous Week Finalization
1. Prior week is finalized and its Events remain immutable.
2. User opens eligible Goal in a current open week.
3. Save a new progress value.
4. New Event belongs to current week; prior finalized Events remain unchanged.

### PF-10 — Server Error
1. Open Update Progress dialog and enter percentage/Note.
2. Save fails.
3. Dialog stays open with input preserved and error shown.
4. User may retry; no partial progress update or orphan Event remains.

## 5. Acceptance Criteria

### A. Progress Updates
- **PRG-AC-01:** New Goal starts with Progress = 0%.
- **PRG-AC-02:** Progress accepts only integer values from 0 to 100.
- **PRG-AC-03:** Update Progress is available on Goal Details for eligible Active Goals.
- **PRG-AC-04:** Slider and numeric input remain synchronized for valid values.
- **PRG-AC-05:** Optional Note accepts up to 500 characters.
- **PRG-AC-06:** Progress can increase or decrease.
- **PRG-AC-07:** Decreasing Progress does not require confirmation.
- **PRG-AC-08:** Saving an unchanged value is disabled and creates no Event.
- **PRG-AC-09:** Invalid, fractional, nonnumeric and out-of-range values show inline errors; slider remains in range.
- **PRG-AC-10:** Successful Save updates Progress and History without full-page reload.
- **PRG-AC-11:** Successful Save closes dialog and shows success notification.

### B. Progress Events & History
- **PRG-AC-12:** Every successful Progress change creates exactly one Progress Event.
- **PRG-AC-13:** Event stores Previous %, New %, timestamp and optional Note.
- **PRG-AC-14:** Event timestamp is assigned by Backend at save time.
- **PRG-AC-15:** Backdating Progress Events is not supported.
- **PRG-AC-16:** Existing Progress Events cannot be edited or deleted.
- **PRG-AC-17:** Corrections create new Events rather than modifying historical Events.
- **PRG-AC-18:** History displays newest Events first.
- **PRG-AC-19:** History displays Date/Time, Previous %, New %, signed Change and Note.
- **PRG-AC-20:** Progress History is a section on Goal Details; initially show 10 Events with Load More.

### C. Goal Lifecycle
- **PRG-AC-21:** Progress = 100% does not automatically complete a Goal.
- **PRG-AC-22:** Active Goal at 100% can decrease Progress.
- **PRG-AC-23:** Mark as Completed is a separate action requiring confirmation.
- **PRG-AC-24:** Completed Goal cannot update Progress until Reopen.
- **PRG-AC-25:** Reopen preserves Progress and does not create a Progress Event.
- **PRG-AC-26:** Archived Goal blocks Progress Updates.
- **PRG-AC-27:** Archived Project blocks Progress Updates for its Goals.
- **PRG-AC-28:** Restore re-enables updates only when Goal and Project are eligible.

### D. Weekly Finalization
- **PRG-AC-29:** Events belong to the week containing their server timestamp under that week's fixed timezone.
- **PRG-AC-30:** Finalized Progress Events remain immutable and viewable.
- **PRG-AC-31:** A new update is allowed in an open current week even when previous weeks are finalized.
- **PRG-AC-32:** Weekly starting Progress equals the last value before week start, or 0% if none exists.
- **PRG-AC-33:** Finalizing a week does not modify existing Progress Events.
- **PRG-AC-34:** Progress Updates do not alter Weekly Focus plans or Contributions.

### E. Data Integrity & Errors
- **PRG-AC-35:** Goal Progress update and Event creation are atomic.
- **PRG-AC-36:** A stale concurrent Save is rejected without overwriting newer Progress.
- **PRG-AC-37:** Conflict response exposes current Progress; Save remains blocked until latest state is reloaded.
- **PRG-AC-38:** Server errors keep dialog open and preserve Progress and Note inputs.
- **PRG-AC-39:** Backend enforces Workspace authorization and Goal lifecycle restrictions.
- **PRG-AC-40:** Failed transactions do not leave orphan Events or inconsistent Goal Progress.

## 6. Approved Desktop Design — 16 UI States

All screens use `/goals/[id]` (mockup example `/goals/456`), a **light white/gray theme with orange accent**, and visibly identify **URL, Screen Name and UI State**. Dialogs do not introduce new routes.

| # | Screen Name | UI State | Required design behavior |
|---|---|---|---|
| 01 | Goal Details | Active Goal — Default | Current progress, Update action, History section |
| 02 | Update Progress | Dialog — Default | Current value, slider, numeric field, optional Note |
| 03 | Update Progress | Validation Error | Inline error; slider stays within 0–100 |
| 04 | Goal Details | Progress History | Section (not tab), newest 10, Load More, accurate counts |
| 05 | Update Progress | Decrease Progress | Lower percentage; no confirmation |
| 06 | Update Progress | Same Value — Save Disabled | No Event for unchanged value |
| 07 | Goal Details | 100% Progress — Active | Both Update Progress and Mark as Completed available |
| 08 | Update Progress | Concurrent Update Conflict | Stale Save blocked; Reload Current Progress |
| 09 | Goal Details | Completed — Read-only | Reopen Goal action |
| 10 | Goal Details | Archived Goal — Read-only | Restore Goal action |
| 11 | Goal Details | Archived Project — Restricted | Restore Project action |
| 12 | Goal Details | Finalized History | Per-Event Finalized markers; mixed weeks supported |
| 13 | Goal Details | Empty Progress History | Empty-state explanation and eligible Update action |
| 14 | Update Progress | Server Error | Preserve dialog and input; show error |
| 15 | Goal Details | Update Success | Updated percentage/history and toast |
| 16 | Update Progress | Concurrent Conflict — Reload | Show latest value and Reload action; Save blocked |

**Design corrections incorporated:**
- Progress History is a **section** on Goal Details, never an independent tab.
- “Showing X of Y” must reflect the rows actually displayed.
- Invalid numeric input must not move the slider outside 0–100.
- After concurrency conflict, the user must reload current progress before attempting a new Save.
- Finalized labels apply only to Events from finalized weeks.
- If Goal and Project are both archived, restore Project before Goal.

## 7. Cross-Epic Integration

| Epic | Contract |
|---|---|
| EPIC-03 — Goals Management | Owns Active/Completed lifecycle, Mark as Completed confirmation, Reopen, Archive and Restore; EPIC-05 respects those states. |
| EPIC-04 — Contributions Management | Time records and manual progress are independent. Contribution changes never create, alter or delete Progress Events. |
| EPIC-06 — Weekly Focus Planning | Progress may inform goal-completion analytics, but does not change focus selection, Expected Attention or saved Weekly Plan versions. |
| EPIC-08 — Weekly Reflection & Finalization | Uses immutable Events and week-specific timezone boundaries for historical reporting; finalized weeks are not rewritten. |

## 8. Architecture and Data Integrity

### Approved constraints
- NestJS is authoritative for progress validation, authorization, lifecycle restrictions, event timestamps, weekly-finalization checks and concurrency.
- Goal progress and its new Progress Event are persisted in **one database transaction**.
- The event's `previousProgress` must match the actual prior persisted Goal progress in that transaction.
- Reject stale writes rather than silently overwriting a concurrent update.
- All Events are append-only and independent of Contribution mutations.
- The browser accesses API capabilities through the established Next.js thin BFF architecture; authorization is enforced by NestJS.

### Implementation recommendations (not additional approved product decisions)
- Use an optimistic concurrency version (or equivalent compare-and-swap condition) on Goal progress writes.
- Return a conflict response containing current progress and current version; reload to obtain a fresh version before resubmission.
- Paginate Event history by a stable cursor (timestamp plus unique Event ID as tie-breaker), newest first, page size 10.
- Use server-side time and transactionally consistent checks to prevent writes into finalized weeks.
- Define database-level constraints for progress bounds and appropriate indexes for `(goalId, timestamp, id)`.
- Use explicit timezone conversion for week attribution and presentation; avoid client-clock authority.

## 9. QA Checklist

- [ ] New Goal begins at 0% and has no Progress Events.
- [ ] 0% and 100% are valid; −1%, 101%, decimals and nonnumbers are invalid.
- [ ] Slider and numeric input synchronize for valid values.
- [ ] Invalid typed 105% shows an error without pushing slider beyond 100%.
- [ ] Note accepts 500 characters; 501 is rejected.
- [ ] Same-value Save is disabled and creates no Event.
- [ ] Increase and decrease each create one correct immutable Event.
- [ ] Progress reaches 100% while Goal remains Active.
- [ ] Active Goal at 100% can decrease Progress.
- [ ] Completed Goal blocks updates; Reopen preserves progress without Event.
- [ ] Archived Goal and archived Project block updates; correct Restore action appears.
- [ ] Existing history is viewable under lifecycle restrictions.
- [ ] Initial History page shows up to 10 Events; Load More retrieves older ones without duplicates.
- [ ] History count matches visible rows and Finalized labels apply per Event.
- [ ] Server timestamps and fixed weekly timezones attribute Events to correct weeks.
- [ ] Previous finalized week does not block current open-week update.
- [ ] Backend defensively rejects an Event whose timestamp week is finalized (not reachable through normal UI, since the current week cannot be finalized).
- [ ] Weekly baseline uses the last pre-week value, otherwise 0%.
- [ ] Stale Save is rejected; Save disabled until Reload Current Progress.
- [ ] Save failure preserves input and produces no partial Goal/Event write.
- [ ] Successful Save closes dialog, updates UI without reload and shows toast.
- [ ] Workspace authorization prevents cross-workspace access and mutations.
- [ ] Contribution changes never modify progress or event history.

## 10. Open Implementation Questions

These are engineering details to resolve during implementation; they do not override the approved business rules:

1. Exact REST endpoint naming and OpenAPI request/response contracts.
2. Optimistic concurrency representation (`version`, ETag, or equivalent).
3. Cursor encoding, total-count availability, and loading-state handling for History.
4. Server error codes and user-facing wording for lifecycle/finalization/conflict cases.
5. Event timestamp precision and timezone formatting conventions.
6. Indexing and transaction/isolation strategy for high-concurrency writes and weekly finalization.

## 11. Definition of Done

EPIC-05 is implementation-complete when all **40 Acceptance Criteria** pass, all **16 approved desktop UI states** and corrections are represented, backend authorization and atomicity are tested, concurrency/finalization edge cases are covered, and the integration contracts with EPIC-03, 04, 06 and 08 are respected.

---

**Specification status:** Final product specification; Discovery and Desktop Design Approved. Engineering implementation remains pending.


## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Explicitly no Effective Date and no Contribution-initiated events; PRD v1.1 §8 superseded | D1 (Q1), C5 |
| Rule 4 and QA item reworded: finalized current week is unreachable | C14 |
| 2026-11-10: account-deletion exception to immutability | D6, BR-029 |
