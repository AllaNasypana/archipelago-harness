# EPIC-03 — Goals Management

**Product:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-03-goals/`](../design/mockups/epic-03-goals/) — index with sources and corrections: [design/README.md](../design/README.md#epic-03--goals)  
**Document type:** MVP Product & UX Specification  
**Language:** English  
**Status:** Business Rules Approved · User Flows Approved · Desktop Design Approved (with documented corrections)  
**Scope:** EPIC-03 only; implementation details owned by later epics are explicitly identified.

## 1. Purpose and Outcome

Goals represent concrete outcomes within Projects. Users can create, browse, edit, complete, reopen, archive and restore Goals while preserving the integrity of their contributions, progress history, weekly plans and finalized reflections.

### 1.1 In Scope

- Goal creation and metadata editing.
- Goals list, filtering, sorting, and details.
- Goal lifecycle: Active, Completed, Archived, Restored.
- Completion confirmation and reopening.
- Permissions and restrictions inherited from the parent Project.
- URL contracts, user flows, UI states and acceptance criteria.

### 1.2 Out of Scope / Other Epic Ownership

- Contribution entry, editing and date eligibility: EPIC-04.
- Detailed progress editing interaction, progress events and history presentation: EPIC-05.
- Weekly Focus planning and version management: EPIC-06.
- Weekly Reflection and finalization: EPIC-08.
- Deleting Goals: not supported in MVP.
- Moving a Goal between Projects: not supported in MVP.

## 2. Domain Model and Business Rules

### 2.1 Goal Fields

| Field | Requirement |
|---|---|
| ID | Stable unique identifier. |
| Project | Required on creation; cannot change after creation. Must be an eligible Active Project. |
| Name | Required; trim leading/trailing whitespace; 2–100 characters after trim. |
| Description | Optional; maximum 1,000 characters. |
| Priority | Required: P1, P2 or P3; **no preselected default** in Create Goal. |
| Deadline | Optional calendar date; past, present and future dates allowed. |
| Status | `Active` or `Completed`. |
| Archived | Independent archive flag, separate from status. |
| Progress | Percentage 0–100; initially 0%. |

**Name uniqueness:** A Goal's normalized name must be unique **within its Project**, ignoring case and leading/trailing whitespace; names of Archived Goals remain reserved (D10). Identical names in different Projects are allowed. The server must enforce this under concurrent requests, not only through frontend validation. The exact database normalization strategy is an implementation choice.

### 2.2 Status, Progress and Completion

1. New Goals are `Active`, not archived, with 0% progress.
2. Active Goal progress may increase or decrease within 0–100%; detailed update mechanics belong to EPIC-05.
3. Progress reaching 100% does **not** automatically set status to `Completed`.
4. An Active Goal may remain at 100% indefinitely if completion is not confirmed.
5. A separate **Mark as Completed** action is available only for an eligible Active Goal at 100%; it opens a confirmation dialog.
6. Confirming completion changes status to `Completed` and preserves progress and history.
7. A Completed Goal's progress is locked. The user must **Reopen Goal** before updating progress.
8. Reopen changes status to `Active` without resetting progress, including when progress is 100%.
9. Completed Goals **can** have Name, Description, Priority and Deadline edited through the dedicated Edit Goal route; this does not unlock progress.
10. New Contributions cannot be added to a Completed Goal until it is reopened. Historical Contributions remain intact.

### 2.3 Archive and Restore

1. Either an Active or Completed Goal may be archived; archive state is independent of completion status.
2. Archiving requires a confirmation dialog explaining the effect on Contributions, progress and Weekly Focus.
3. Archived Goals are read-only: no metadata edits, new Contributions, or progress updates.
4. Archive preserves Goal status, progress, Contributions, Progress Events, Weekly Focus membership and finalized history.
5. An archived Goal remains in current Weekly Focus with an **Archived** warning; it is not automatically removed.
6. Restore Goal is immediate (no confirmation) and shows a success notification.
7. Restore preserves the Goal's previous Active/Completed status and progress.
8. Restore Goal is prohibited while its parent Project is archived. Restore the Project first.
9. Restoring a Project does not automatically restore Goals that were independently archived.
10. If both parent Project and Goal are archived: **Restore Project → Restore Goal**.
11. Archiving or restoring a Goal never modifies finalized Contributions, Progress Events, weekly plans or Reflections.
12. Delete Goal is not offered in the UI or public MVP API.

### 2.4 Project Inheritance and Weekly Focus

- A Goal cannot be created under an archived Project.
- An archived parent Project prevents editing Goal metadata, adding Contributions, updating progress, completing, reopening or restoring the Goal while the parent remains archived. The child's own status and archive flag are unchanged.
- A Completed Goal already in the current Weekly Focus stays there until the user manually saves a changed plan in Weekly Focus; completion does not automatically remove it. Weekly Reflection never changes plans (C13).
- An archived Goal already in Weekly Focus stays there with an Archived warning.
- Goal Priority updates can affect current recommendations but must not rewrite saved Weekly Focus plan versions.
- Historical records remain immutable after the relevant week has been finalized.

### 2.5 Deadline and Overdue

- Deadline is optional and can be in the past.
- A past deadline may produce an **Overdue** indicator, but never automatically changes Goal status.
- The Overdue indicator is shown only for Active, non-archived Goals whose Deadline is before today in the profile timezone; Completed and Archived Goals never show it (D13).

## 3. Navigation and URL Contract

| Screen | Route | Notes |
|---|---|---|
| Goals List | `/goals` | Filters represented by query parameters. |
| Create Goal | `/goals/create` | User selects Project manually when entered from Goals List. |
| Create Goal from Project Details | `/goals/create?projectId=123` | Same Create route; preselect eligible parent Project. |
| Goal Details | `/goals/[id]` | Active, Completed, Archived, parent-archived and success states. |
| Edit Goal | `/goals/[id]/edit` | Metadata only, no progress editor. |

`123` and `[id]` are illustrative IDs. The sample domain in mockups is not an approved production hostname.

### 3.1 Goals List Query Parameters

| Parameter | Supported intent | Example |
|---|---|---|
| `view` | Archive view: `active`, `archived`, `all`. | `/goals?view=archived` |
| `status` | Goal status: `active`, `completed`. | `/goals?status=completed` |
| `projectId` | Filter by Project ID. | `/goals?projectId=123` |
| `priority` | Priority number: `1`, `2`, `3`. | `/goals?priority=1` |

Example combined filter: `/goals?view=active&status=active&projectId=123&priority=1`.

**Approved behavior:**

- URL query parameters are the source of truth for filter state.
- Filters are combinable and update the URL through client navigation without a full page reload.
- Refresh and browser Back/Forward restore filter state from the URL.
- Clear filters removes filter query parameters.
- Invalid or unknown values are handled gracefully without crashing the page.
- TanStack Query keys incorporate the normalized filter state to avoid stale or incorrectly shared cached results.
- Default Goals List sorting is **Priority P1 → P2 → P3**, then **Name A–Z** within each priority.

**Approved default (D14):** when `view` is absent the list behaves as `view=active`. **Implementation detail to define:** whether an invalid value is ignored or removed from the URL. These choices must be consistent across UI, API and tests; they are not separate approved product rules.

### 3.2 Navigation Outcomes

- Successful Create Goal → `/goals/[id]`.
- Successful Edit Goal → `/goals/[id]`.
- Archive Confirmation is a dialog on `/goals/[id]`.
- Restore and Reopen operate on `/goals/[id]`; neither requires a new route.
- A Project Details Create Goal action navigates to `/goals/create?projectId=<project-id>`.

## 4. User Flows

### GF-01 — Create Goal from Goals List

1. Navigate to `/goals`, choose **Create Goal**.
2. On `/goals/create`, enter Name; select an Active Project; select P1/P2/P3 explicitly; optionally enter Description and Deadline.
3. Display initial progress as read-only 0%.
4. Validate required fields, lengths and normalized uniqueness.
5. Submit; on success navigate to the new Goal Details.
6. On error, preserve entered values and display actionable inline/server feedback.

### GF-02 — Create Goal from Project Details

1. From `/projects/[id]`, select Create Goal.
2. Navigate to `/goals/create?projectId=<id>`.
3. Preselect the referenced eligible Active Project; validate it server-side.
4. Complete remaining fields, submit and navigate to Goal Details.
5. If the Project is archived, inaccessible or invalid, do not permit creation.

### GF-03 — Browse and Filter Goals

1. Open `/goals`.
2. Show table: Name, Project, Priority, Status, Progress, Actions.
3. Default sort Priority P1→P3, then Name A–Z.
4. Change Status, Project, Priority and Active/Archived/All filters.
5. Reflect selected filters in URL query parameters; allow combinations, sharing and Back/Forward.
6. Open a Goal to view details.

### GF-04 — Edit Goal Metadata

1. Open an eligible Active or Completed Goal and choose Edit.
2. Navigate to `/goals/[id]/edit`.
3. Edit Name, Description, Priority and Deadline; show Project as immutable.
4. Do **not** expose progress editing on this form.
5. Validate and save; return to Goal Details.
6. Block editing for archived Goals and Goals in archived Projects.

### GF-05 — Mark as Completed

1. Eligible Active Goal reaches 100% progress and remains Active.
2. User chooses **Mark as Completed**.
3. Show confirmation; Cancel leaves status Active at 100%.
4. Confirm changes status to Completed; progress and history are preserved.
5. Completed Goal blocks new Contributions and progress updates until Reopen.

### GF-06 — Reopen Completed Goal

1. Open eligible Completed Goal.
2. Choose Reopen Goal.
3. Status changes to Active, progress stays unchanged (including 100%).
4. Display success feedback; subsequent Contributions/progress updates are subject to normal Active Goal rules.

### GF-07 — Archive Goal

1. On an eligible Active or Completed Goal, choose Archive.
2. Show confirmation detailing read-only behavior, blocked Contributions/progress, retained Weekly Focus entry and preserved history.
3. Cancel leaves state unchanged; confirm sets archive flag.
4. Display Archived read-only state at the same Details route.

### GF-08 — Restore Goal

1. Open Archived Goal.
2. If parent Project is Active, choose Restore Goal.
3. Restore immediately and show success toast; previous status and progress remain.
4. If parent Project is Archived, disable/block Restore Goal and direct user to Restore Project first.

## 5. Acceptance Criteria

### 5.1 Creation and Validation

- **GOAL-AC-01:** Authorized users can create a Goal in an eligible Active Project within their Workspace.
- **GOAL-AC-02:** Name is required and trimmed; normalized length is 2–100 characters.
- **GOAL-AC-03:** Goal Name is unique per Project, ignoring case and leading/trailing whitespace, including under concurrent requests.
- **GOAL-AC-04:** Description is optional and limited to 1,000 characters.
- **GOAL-AC-05:** Priority must be explicitly selected from P1, P2, P3; no default selection is made on Create.
- **GOAL-AC-06:** Deadline is optional and accepts past, current and future dates.
- **GOAL-AC-07:** New Goal is Active, unarchived, with 0% progress.
- **GOAL-AC-08:** Successful creation navigates to `/goals/[id]`.
- **GOAL-AC-09:** Project is immutable after Goal creation.
- **GOAL-AC-10:** Create from Project Details uses `/goals/create?projectId=<id>` and preselects that eligible Project; Create from Goals List requires manual Project selection.
- **GOAL-AC-11:** Frontend validation and backend validation enforce the same field constraints; server remains authoritative.

### 5.2 List and URL State

- **GOAL-AC-12:** Goals List includes Name, Project, Priority, Status, Progress and Actions columns.
- **GOAL-AC-13:** Default sort is Priority P1→P3 and then Name A–Z.
- **GOAL-AC-14:** Filters support Status, Project, Priority and archive view, independently and in combination.
- **GOAL-AC-15:** Filters are encoded in `view`, `status`, `projectId`, `priority` query parameters.
- **GOAL-AC-16:** Changing filters updates the URL without a full page reload.
- **GOAL-AC-17:** Refresh and Back/Forward restore the selected filters from the URL.
- **GOAL-AC-18:** Clear filters removes filter parameters; invalid values are handled gracefully.
- **GOAL-AC-19:** Query/cache identity incorporates normalized filters.

### 5.3 Editing, Completion and Reopening

- **GOAL-AC-20:** Eligible Active and Completed Goals allow metadata edits to Name, Description, Priority and Deadline.
- **GOAL-AC-21:** Edit uses `/goals/[id]/edit`; Project is read-only and Progress is not editable on this page.
- **GOAL-AC-22:** Progress reaching 100% does not automatically complete the Goal.
- **GOAL-AC-23:** Mark as Completed is available only to an eligible Active Goal at 100% and requires confirmation.
- **GOAL-AC-24:** Canceling completion leaves the Goal Active at 100%.
- **GOAL-AC-25:** Completed Goals block progress changes and new Contributions until Reopen.
- **GOAL-AC-26:** Reopen changes Completed to Active without resetting progress or deleting history.

### 5.4 Archive, Restore and Historical Integrity

- **GOAL-AC-27:** Both Active and Completed Goals may be archived.
- **GOAL-AC-28:** Archive requires confirmation with explicit Contributions/Progress/Weekly Focus consequences.
- **GOAL-AC-29:** Archived Goals are read-only and block metadata edits, Contributions and progress updates.
- **GOAL-AC-30:** Archive preserves the underlying Active/Completed status and progress.
- **GOAL-AC-31:** Archive retains Goal in current Weekly Focus with Archived warning.
- **GOAL-AC-32:** Completed Goals remain in current Weekly Focus until a manual plan change in Weekly Focus (Reflection does not modify plans).
- **GOAL-AC-33:** Restore Goal requires no confirmation, displays success notification and preserves status/progress.
- **GOAL-AC-34:** Restore Goal is prohibited while the parent Project is archived.
- **GOAL-AC-35:** Restoring Project never automatically restores independently archived Goals.
- **GOAL-AC-36:** Archive, Restore, Complete and Reopen do not rewrite finalized Contributions, Progress Events, weekly plan versions or Reflections.
- **GOAL-AC-37:** Delete Goal is absent from the MVP UI and public API.
- **GOAL-AC-38:** An Overdue indicator does not automatically modify Goal status.

### 5.5 Authorization, Errors and Reliability

- **GOAL-AC-39:** Every read and mutation is authorized for the correct Workspace; cross-Workspace access is rejected.
- **GOAL-AC-40:** Backend rejects mutations prohibited by Goal or parent Project state even if a client bypasses UI restrictions.
- **GOAL-AC-41:** Duplicate submissions and concurrent name collisions do not create duplicate Goals.
- **GOAL-AC-42:** Empty, Loading, Validation Error and Server Error states provide clear feedback and recovery paths.
- **GOAL-AC-43:** Canceling any confirmation dialog causes no state change.
- **GOAL-AC-44:** Invalid `projectId` in Create URL never bypasses Project eligibility or Workspace authorization.

## 6. Desktop Design Specification

**Approved design direction:** Archipelago light theme, predominantly white and gray with **orange** as the accent; Grafana-inspired compact, accessible tables and functional information hierarchy. The 16-state design board is approved **subject to the corrections below**; a blue accent appearing in an intermediate composite mockup is not approved.

Every mockup must visibly include **URL, Screen Name and UI State**. Sample Project names, Goal names, progress values, dates, counts and IDs are illustrative, not application data.

| # | Screen | URL | State / Key behavior |
|---|---|---|---|
| 1 | Goals List | `/goals` | Default table; priority/name sorting. |
| 2 | Goals List | `/goals?view=active&priority=1` | Filtered via query parameters. |
| 3 | Goals List | `/goals?view=archived` | Empty state, clear filters action. |
| 4 | Goals List | `/goals` | Loading skeleton. |
| 5 | Goals List | `/goals` | Server Error, retry action. |
| 6 | Create Goal | `/goals/create` | Project not selected; Priority **not preselected**. |
| 7 | Create Goal from Project | `/goals/create?projectId=123` | Project preselected; no additional nested route. |
| 8 | Create Goal | `/goals/create` | Inline validation errors and blocked invalid submission. |
| 9 | Goal Details | `/goals/[id]` | Active at 100%, before completion. |
| 10 | Completion Confirmation | `/goals/[id]` | Mark as Completed dialog. |
| 11 | Goal Details | `/goals/[id]` | Completed, progress locked, Edit route available. |
| 12 | Goal Details | `/goals/[id]` | Archived read-only; Restore Goal if parent Active. |
| 13 | Edit Goal | `/goals/[id]/edit` | Name, Description, Priority, Deadline; Project immutable; **no Progress editor**. |
| 14 | Archive Confirmation | `/goals/[id]` | Confirmation and impact warning. |
| 15 | Restore Goal | `/goals/[id]` | Success toast, status/progress preserved. |
| 16 | Goal Details | `/goals/[id]` | Parent Project archived, restricted operations, Restore Project first. |

**Additional reviewed state:** Reopen Success on `/goals/[id]`, showing Active status with retained progress (including 100%) and success notification. It may be delivered as a variant of the Goal Details state rather than a separate route.

### 6.1 Mandatory Design Corrections

1. Use white/gray/orange Archipelago palette; **not blue**.
2. Create Goal must not preselect Priority.
3. Edit Goal must not contain progress editing; EPIC-05 owns the progress-update interaction.
4. Completed Goal metadata editing navigates to `/goals/[id]/edit`, rather than editing inline on Details.
5. Create from Project Details uses `/goals/create?projectId=<id>`, not `/projects/[id]/goals/create`.
6. Distinguish Goal Archived (Restore Goal) from parent Project Archived (Restore Project first).
7. Archive icons and labels must not imply Delete; deletion is excluded from MVP.
8. Progress/Activity and Contribution tabs in illustrative mockups are not approved as detailed EPIC-03 feature requirements; their final content belongs to EPIC-04/05. A "Recent activity" feed is out of MVP scope (A7).
9. The archived-Goal mockup text "remove it … in Reflection" is incorrect: plan changes happen only in Weekly Focus (C13).

## 7. Architecture and Integration Boundaries

- **Next.js App Router:** page routing, URL-driven filter state and thin BFF behavior.
- **NestJS:** sole authority for business rules, lifecycle transitions, validation and authorization.
- **PostgreSQL/Prisma:** persistence and concurrency-safe Goal name uniqueness scoped to Project.
- **Frontend forms:** React Hook Form and Zod may mirror server-side constraints; server validation is authoritative.
- **TanStack Query:** normalized filter-dependent query keys; invalidate affected Goal, list, Project Details and related view queries after mutations.
- **Cross-module coordination:** honor the established modular-monolith contracts and preserve historical data; do not directly mutate other modules' historical records during Goal transitions.

This document intentionally does **not** prescribe endpoint names, database indexes, domain event names or the exact internal Progress Event implementation; those are engineering design decisions unless separately approved.

## 8. QA / Edge-Case Checklist

- Create Goal with missing Project, missing Priority, blank Name, 1-character Name, 101-character Name or Description over 1,000 characters.
- Attempt same normalized Goal Name within one Project, including mixed case and leading/trailing whitespace; verify different Projects may reuse the name.
- Simultaneous creates with same normalized name yield at most one success.
- Open Create with `?projectId=` referring to missing, archived or unauthorized Project.
- Verify default sort within equal priorities is Name A–Z.
- Verify all four filters combine, survive refresh and Back/Forward, and clear correctly.
- Verify Active 100% remains Active on Cancel and only becomes Completed on confirmation.
- Verify Completed metadata remains editable through Edit route, while progress and Contributions remain locked.
- Verify Reopen at 100% retains 100% and returns to Active.
- Archive both Active and Completed Goals and verify original status is preserved.
- Verify Archive confirmation Cancel does not mutate data.
- Verify archived Goal stays in current Weekly Focus with warning and historical plan versions remain unchanged.
- Verify Restore Goal is blocked while Project archived; Restore Project then Restore Goal works without automatic child restoration.
- Verify finalized Contributions, Progress Events and Reflections are never rewritten by Goal lifecycle actions.
- Verify unauthorized cross-Workspace reads/mutations are rejected server-side.
- Verify Empty, Loading, Validation Error, Server Error, retry and success notification states.

## 9. Open Implementation Questions (Not Product Approvals)

These do not override the approved rules:

1. ~~Canonical `/goals` behavior when `view` is omitted~~ — resolved: `view=active` (D14); invalid-query normalization policy remains an implementation detail.
2. ~~Overdue for Completed/Archived~~ — resolved: suppressed (D13).
3. Define precise API routes, payload schemas, persistence constraints and domain-event contracts.
4. Finalize the presentation of Contributions, Progress Events and Activity in EPIC-04/05.
5. Finalize the exact Progress update control and audit/event behavior in EPIC-05.

## 10. Definition of Done — EPIC-03

- All approved business rules and acceptance criteria implemented and tested.
- Routes and URL query filtering behave as specified.
- Goal lifecycle transitions are authorized and validated on the backend.
- UI follows approved Archipelago light/orange design and documented corrections.
- Archive/Restore preserve cross-epic historical integrity.
- Loading, Empty, Validation Error, Server Error and success states are implemented.
- Cross-Workspace, concurrency and archived-parent edge cases are covered by automated tests.
- EPIC-04/05/06/08 responsibilities remain isolated and are not silently implemented as part of EPIC-03.


## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Archived Goal names stay reserved | D10 (Q11) |
| Removed "or Reflection" as a way to change Weekly Focus (§2.4, GOAL-AC-32, mockup note) | C13 |
| Overdue only for Active, non-archived Goals; open question 2 closed | D13 (Q14) |
| Default `/goals` view = active; open question 1 closed | D14 (Q15) |
| Activity feed declared out of scope | A7 |
