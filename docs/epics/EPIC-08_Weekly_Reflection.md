# EPIC-08 — Weekly Reflection & Finalization

**Project:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-08-weekly-reflection/`](../design/mockups/epic-08-weekly-reflection/) — index with sources and corrections: [design/README.md](../design/README.md#epic-08--weekly-reflection--finalization)  
**Document language:** English  
**Status:** Design Approved  
**Scope:** MVP  
**Source of truth:** Approved Product Discovery Rounds 1–2, Final Discovery, and Desktop Mockup Sets 1–4 (16 states).  
**Related epics:** EPIC-04 Contributions; EPIC-05 Progress Tracking; EPIC-06 Weekly Focus; EPIC-07 Alignment Dashboard.

## 1. Purpose and Product Outcome

Weekly Reflection enables a user to review a completed calendar week, compare intended attention with actual tracked time, inspect historical Goal progress, optionally write qualitative reflections, and **manually and irreversibly finalize** that week. Finalization preserves a reliable historical record. Reflection does not create Contributions, change Goal Progress or Goal Status, or rewrite Weekly Plans.

The Alignment Dashboard (EPIC-07) is the analytical view; Weekly Reflection is the deliberate review and finalization workflow. No automatic finalization is permitted.

## 2. Scope and Non-goals

**In scope:** Past-week selection and pending/finalized status; attention review; Original/Current comparison; historical progress review; three optional reflection answers; server-side autosaved drafts with optimistic concurrency; confirmation dialog; atomic, idempotent finalization; read-only finalized weeks; missing-plan and missing-activity states; concurrency and server-error handling.

**Out of scope:** Finalizing the current week; automatically finalizing any week; reopening finalized weeks; editing historical Contributions or Progress Events through Reflection; creating or retroactively confirming Weekly Plans; AI-generated insights; changing Goals' current progress/status as a consequence of finalization.

## 3. Approved Business Decisions (32)

### 3.1 Discovery Round 1 — 12 decisions

| ID | Approved decision |
|---|---|
| D01 | Reflection and finalization are available only after the calendar week has ended; the current week cannot be finalized. |
| D02 | Reflection is a separate `/reflection` page with a week selector and navigation from the Dashboard. |
| D03 | All past weeks, starting with the user's first week of app use (the calendar week containing account creation, in the registration timezone — A2), are available in the MVP. |
| D04 | Unfinalized past weeks are marked **Pending Reflection**; they do not block work in later weeks. |
| D05 | Reflection supports **Original vs Actual** and **Current vs Actual**, with a comparison toggle. |
| D06 | Historical Goal Progress shows start, end, and change in percentage points (pp). |
| D07 | The three prompts are: **What went well?**, **What didn't go as planned?**, **What will I change next week?** |
| D08 | All three reflection answers are optional; finalization is allowed with blank answers. |
| D09 | Finalization requires a confirmation dialog explaining what will be locked. |
| D10 | After finalization, reflection answers and historical weekly data are read-only. The only exception is self-service account deletion (BRD FR-046, BR-029), which removes all of the user's data. |
| D11 | A week without a confirmed Weekly Plan can still be finalized; show **No Confirmed Plan**. |
| D12 | A week without Contributions can still be finalized; show **No Actual Data**. |

### 3.2 Discovery Round 2 — 16 decisions

| ID | Approved decision |
|---|---|
| D13 | Start Progress is the latest Progress Event strictly before the week start; if none exists, use 0%. |
| D14 | End Progress is the latest Progress Event strictly before the week end (exclusive), even when finalization happens later. |
| D15 | Weekly Progress Change = End Progress − Start Progress, in pp; negative changes are valid. |
| D16 | Progress Review includes Goals in Original or Current Plan; when no confirmed plan exists, include Goals with Contributions or Progress Events during the week. |
| D17 | Reflection Draft answers are automatically saved server-side and can be resumed later. |
| D18 | Each answer allows up to 2,000 characters, including line breaks. |
| D19 | Autosave exposes **Saving…**, **Saved**, and **Save Failed**, with retry on failure. |
| D20 | Finalize is blocked while draft changes remain unsaved. |
| D21 | Finalization uses one atomic server transaction that checks week state, persists Reflection, marks the week Finalized, and enforces subsequent write restrictions. |
| D22 | Concurrent Contribution changes invalidate finalization; refresh the review and require a new confirmation. |
| D23 | Repeated finalization requests are idempotent; no duplicate side effects. |
| D24 | A failed finalization leaves the week Pending and preserves its saved Draft; allow retry. |
| D25 | Historical week boundaries use that week's fixed timezone, not the current profile timezone. |
| D26 | Contributions added late to a past, unfinalized week update Actual Attention and the final review. |
| D27 | Finalized weeks cannot be reopened in the MVP. |
| D28 | Past weeks may be finalized in any order; no prerequisite to finalize older pending weeks first. |

### 3.3 Final Discovery — 4 decisions

| ID | Approved decision |
|---|---|
| D29 | Progress Review shows the **union** of Goals in Original and Current Plans, without duplicates, regardless of comparison-toggle selection. |
| D30 | With no Progress Event inside the week but a prior event, Start = End = prior value and Change = 0 pp. |
| D31 | Reflection Draft autosaves use optimistic concurrency with revision/version. Reject stale writes and offer to reload the latest Draft. |
| D32 | Any relevant change to Contributions, historical Progress/Plan state, Draft revision, or week status invalidates Finalize Confirmation and requires renewed review and confirmation. |

## 4. Week Identity, Lifecycle, and Navigation

- A week runs from **Monday 00:00 inclusive to the next Monday 00:00 exclusive**, evaluated using the timezone fixed for that week.
- A profile timezone change affects future weeks only; historical week boundaries remain unchanged.
- A past week is **Pending Reflection** until explicitly finalized, then **Finalized**. The current week is not eligible for finalization.
- Pending weeks can be revisited, edited where permitted by the owning epic, and finalized in arbitrary chronological order.
- Canonical overview URL: `/reflection`. Selected-week URL: `/reflection?week=YYYY-MM-DD`, where the value is the Monday date for the week (e.g., `/reflection?week=2026-11-02`).
- Dashboard navigation into Reflection preserves the selected historical week context.
- The selected week and its status must be derived from server-authoritative week data, not inferred from the client alone.

## 5. Review Data and Calculations

### 5.1 Attention alignment

Reuse EPIC-07 calculations and presentation rules; do not implement a competing formula.

- **Tracked Time:** sum of all Contribution durations within the selected week, including Contributions to Goals outside the selected plan.
- **Actual Attention for a Goal:** that Goal's Contribution minutes divided by all tracked Contribution minutes in the week, times 100.
- **Focus Attention:** sum of Contribution minutes attributed to Goals in the **selected Original/Current plan baseline**, divided by total tracked minutes, times 100.
- **Unplanned Attention:** sum of Contribution minutes attributed to Goals **outside the selected plan baseline**, divided by total tracked minutes, times 100.
- **Planned vs Actual deviation:** Actual % − Planned %, in **percentage points**, for rows with a defined Planned %.
- **Original vs Current toggle:** changes the selected planned baseline, and therefore potentially Focus/Unplanned classification and aggregates; it does not change underlying Contribution minutes or Tracked Time.
- Use exact minutes for calculations; display percentages and pp deviations to **one decimal**. Explain rounding differences where relevant.
- With a confirmed plan but **zero Contributions**, show Planned values and **No Actual Data** rather than fabricated 0% actual shares or deviations.
- With **no confirmed plan**, show Tracked Time if present, but Focus/Unplanned Attention and Planned vs Actual comparison are unavailable (`—`). **Do not label all tracked time as 100% Unplanned.**
- A Goal with zero Contributions shows 0% Actual **only if total weekly tracked time is greater than zero**.
- The Unplanned Attention row has no Planned Attention baseline; its **Δ (pp) must be `—`**, not a calculated deviation.

### 5.2 Historical Goal Progress

- **Start:** last Progress Event timestamp strictly before week start; default 0% when no earlier event exists.
- **End:** last Progress Event timestamp strictly before week end (exclusive); if there is no event within the week, carry forward the start value.
- **Change:** End − Start in pp, including negative values.
- The display is historical: a Goal's current progress today must not overwrite its historical week-end value.
- With a confirmed plan, review the **deduplicated union** of Goals in Original and Current Plan; changing the attention-comparison toggle must not change this set.
- With no confirmed plan, include Goals with Contributions or Progress Events in that week; do not add all user Goals without relevant activity.
- Completed/Archived Goals already present in an applicable historical plan remain visible in the review.
- Reflection never creates or edits Progress Events and does not derive progress percentages from tracked time.

## 6. Reflection Answers and Draft Persistence

The following fields are optional, with a maximum of **2,000 characters each**, including newline characters:

1. **What went well?**
2. **What didn't go as planned?**
3. **What will I change next week?**

- Autosave persists Draft changes on the server, allowing a user to leave and return.
- Show a meaningful status: **Saving…**, **Saved**, or **Save Failed**. Provide **Retry** on failure.
- Use an optimistic `revision` or equivalent version precondition on each Draft write. A stale write is rejected; show a conflict and offer to reload the current server Draft. Never silently overwrite newer content.
- **Finalize Week is disabled** while autosave is pending or unsaved changes exist, including after a failed save.
- No **Discard Changes** action is included in the approved Screens 05–07.
- Finalization is allowed with all answers blank, provided there are no unsaved changes.
- Once finalized, all three answers are read-only.

## 7. Finalization Contract

### 7.1 Pre-conditions

A user may request finalization only for an eligible past week that is not already finalized. The UI must have successfully saved the current Draft, and the user must review a confirmation dialog enumerating the records that become locked:

- Contributions for that week;
- historical Progress Events / weekly Progress history as governed by EPIC-05;
- Original and Current Weekly Plan versions;
- Reflection answers.

A missing confirmed Weekly Plan or missing Contributions is **not** a blocker.

### 7.2 Concurrency and atomicity

- The server revalidates the selected week, authorization, Draft revision, and a coherent version/snapshot of all Reflection-relevant data (Contributions, historical Progress/Plan state, week status) when executing finalization.
- The check and state transition must be atomic relative to competing writes. All endpoints that mutate week-owned historical data must enforce the finalized state and coordinate with the finalization transaction; a UI-only lock is insufficient.
- If any relevant data changed since the user confirmed, **do not finalize**. Present refreshed review data and require another explicit confirmation.
- An idempotent repeat request must not create duplicate finalized records, notifications, or other side effects.
- On a definitive transaction failure, leave the week Pending and preserve the Draft. On an ambiguous network failure, retry safely and resolve authoritative server status rather than assuming failure or success.
- Show **Week Finalized** success only after the server confirms finalization.
- Finalized weeks cannot be reopened in MVP; all relevant historical records and answers remain read-only.

### 7.3 Retry UI

On the finalization server-error screen, present **one primary retry action: `Retry Finalization`**. Do not show a competing `Finalize Week` button alongside it. Retry must be idempotent and revalidate current data; if review data changed, require a fresh confirmation rather than silently committing an outdated confirmation.

## 8. User Flows (16)

| ID | Flow | Expected outcome |
|---|---|---|
| WR-01 | Open Weekly Reflection | Navigate to `/reflection`; see eligible past weeks and statuses. |
| WR-02 | Select Pending Week | Open `/reflection?week=YYYY-MM-DD` and load current Review. |
| WR-03 | Review Attention Alignment | Toggle Original/Current vs Actual; show consistent attention data. |
| WR-04 | Review Historical Progress | See union of plan Goals, start/end/delta; no duplicate Goals or dependence on attention toggle. |
| WR-05 | Write Reflection Answers | Edit any of three optional prompts within character limits. |
| WR-06 | Autosave Reflection Draft | Observe Saving… → Saved after successful server persistence. |
| WR-07 | Recover Failed Autosave | See Save Failed; retry; Finalize stays disabled until saved. |
| WR-08 | Resume Pending Reflection | Reopen a week and retrieve its latest saved Draft. |
| WR-09 | Finalize Week | Confirm locking, revalidate, atomically finalize, show success. |
| WR-10 | Finalize Without Plan | Show No Confirmed Plan; still permit finalization. |
| WR-11 | Finalize Without Activity | Show No Actual Data; still permit finalization. |
| WR-12 | Handle Concurrent Changes | Invalidate confirmation, refresh review, require reconfirmation. |
| WR-13 | View Finalized Reflection | Display historical metrics and answers in read-only mode. |
| WR-14 | Finalize Weeks Out of Order | Select and finalize any eligible pending past week. |
| WR-15 | Handle Draft Version Conflict | Reject stale autosave; present conflict and reload-current-draft option. |
| WR-16 | Handle Finalization Review Conflict | Detect changed review data, cancel prior confirmation, re-review and reconfirm. |

## 9. Acceptance Criteria (45)

### 9.1 Availability and navigation

| ID | Acceptance criterion |
|---|---|
| WR-AC-01 | Reflection is accessible at `/reflection`. |
| WR-AC-02 | All past weeks from the user's first week of use can be selected. |
| WR-AC-03 | The current week cannot be finalized. |
| WR-AC-04 | Past, unfinalized weeks display Pending Reflection. |
| WR-AC-05 | A pending past week does not block a new week's work. |
| WR-AC-06 | Navigation from Dashboard preserves the selected week context. |
| WR-AC-07 | Historical week boundaries use the timezone fixed for that week. |

### 9.2 Attention and progress review

| ID | Acceptance criterion |
|---|---|
| WR-AC-08 | Reflection offers Original vs Actual and Current vs Actual comparison. |
| WR-AC-09 | Actual Attention is derived from weekly Contributions, using EPIC-07 formulas. |
| WR-AC-10 | Focus/Unplanned classification follows the selected plan baseline. |
| WR-AC-11 | Start Progress is the last event before week start, or 0% if none. |
| WR-AC-12 | End Progress is the last event before the exclusive week end, carrying forward the start value if no event occurs during the week. |
| WR-AC-13 | Weekly Progress Change equals End − Start in pp. |
| WR-AC-14 | Negative weekly Progress Change is supported. |
| WR-AC-15 | With a confirmed plan, Progress Review includes Goals from Original or Current Plan. |
| WR-AC-16 | Without a confirmed plan, Progress Review includes Goals with Contributions or Progress Events during the week. |
| WR-AC-17 | Late Contributions to an unfinalized past week update Actual Attention. |
| WR-AC-18 | Reflection does not modify Goal Progress, Goal Status, or Contributions. |

### 9.3 Drafts and autosave

| ID | Acceptance criterion |
|---|---|
| WR-AC-19 | Three reflection answer fields are provided with the approved prompts. |
| WR-AC-20 | All three answers are optional. |
| WR-AC-21 | Each answer is limited to 2,000 characters including newlines. |
| WR-AC-22 | Draft changes are automatically persisted on the server. |
| WR-AC-23 | The latest saved Draft is restored on reopening the week. |
| WR-AC-24 | UI distinguishes Saving…, Saved, and Save Failed. |
| WR-AC-25 | Failed autosaves can be retried. |
| WR-AC-26 | Finalization is unavailable while Draft changes are unsaved or being saved. |

### 9.4 Finalization

| ID | Acceptance criterion |
|---|---|
| WR-AC-27 | Finalize Week opens a confirmation dialog. |
| WR-AC-28 | The dialog identifies historical records and answers that become immutable. |
| WR-AC-29 | Server finalization is atomic with eligibility and concurrency checks. |
| WR-AC-30 | Repeated finalization requests are idempotent. |
| WR-AC-31 | Concurrent changes affecting review data prevent finalization until re-review. |
| WR-AC-32 | A failed finalization does not mark the week Finalized. |
| WR-AC-33 | The saved Draft survives finalization failure. |
| WR-AC-34 | Finalized Reflection is read-only. |
| WR-AC-35 | Reopen Week is not supported in MVP. |
| WR-AC-36 | Past weeks can be finalized in any order. |
| WR-AC-37 | Finalization is allowed without a confirmed Weekly Plan. |
| WR-AC-38 | Finalization is allowed without Contributions. |
| WR-AC-39 | Contributions belonging to a finalized week cannot be changed. |
| WR-AC-40 | Historical Progress Events and Weekly Plan versions governed by the finalized week cannot be modified. |

### 9.5 Final Discovery additions

| ID | Acceptance criterion |
|---|---|
| WR-AC-41 | Progress Review deduplicates the union of Original/Current Plan Goals and does not change the Goal set when the attention comparison toggle changes. |
| WR-AC-42 | If no Progress Event occurs during the week, End carries forward Start and Change is 0 pp, including when Start is nonzero. |
| WR-AC-43 | Draft writes require the expected revision; stale writes are rejected with an explicit conflict and an option to reload the latest server Draft. |
| WR-AC-44 | Finalize confirmation is invalidated by relevant Contributions, Progress/Plan state, Draft revision, or week-status changes. |
| WR-AC-45 | After a finalization conflict, refreshed data must be reviewed and the user must explicitly reconfirm before a new finalization attempt. |

## 10. Approved Desktop Mockups — 16 UI States

**Visual language:** Grafana-inspired light UI, predominantly white/gray, restrained orange accent, compact data tables/cards, clear hierarchy, responsive and accessible controls. The images are design examples; example weeks and numbers are not real user data. Each state is approved with the corrections below, even if an earlier generated illustration still displays the pre-correction version.

| Screen | URL | Screen name | Approved UI state / behavior |
|---|---|---|---|
| 01 | `/reflection` | Weekly Reflection | Pending Weeks Overview; statuses and historical week selection. |
| 02 | `/reflection?week=2026-11-02` | Weekly Reflection | Pending Week — Review; summary and review entry points. |
| 03 | `/reflection?week=2026-11-02` | Weekly Reflection | Original vs Actual; **Unplanned Attention Δ (pp) = `—`**, not +18.0 pp. |
| 04 | `/reflection?week=2026-11-02` | Weekly Reflection | Historical Goal Progress; Start, End, Change. |
| 05 | `/reflection?week=2026-11-02` | Weekly Reflection | Draft — Editing Answers; autosave; **no Discard Changes** action. |
| 06 | `/reflection?week=2026-11-02` | Weekly Reflection | Autosave — Saving / Saved; **Finalize disabled while Saving**. |
| 07 | `/reflection?week=2026-11-02` | Weekly Reflection | Autosave Failed — Retry; **Finalize disabled with unsaved changes**; no Discard Changes. |
| 08 | `/reflection?week=2026-11-02` | Weekly Reflection | No Confirmed Plan / No Actual Data; Finalize allowed if Draft saved. |
| 09 | `/reflection?week=2026-11-02` | Weekly Reflection | Ready to Finalize; Draft saved, confirmation required. |
| 10 | `/reflection?week=2026-11-02` | Weekly Reflection | Finalize Confirmation Dialog; list locked data; revalidate server-side. |
| 11 | `/reflection?week=2026-11-02` | Weekly Reflection | Finalized — Success; show only after confirmed server commit. |
| 12 | `/reflection?week=2026-11-02` | Weekly Reflection | Finalized — Read-only; no Reopen. |
| 13 | `/reflection?week=2026-11-02` | Weekly Reflection | Concurrent Changes Conflict; prior confirmation invalid; review refreshed data and reconfirm. |
| 14 | `/reflection?week=2026-11-02` | Weekly Reflection | Finalization Server Error; **only `Retry Finalization`**, idempotent and revalidated. |
| 15 | `/reflection?week=2026-11-02` | Weekly Reflection | No Weekly Plan — Finalize Allowed; Tracked Time may be nonzero; **Focus Attention = `—`, Unplanned Attention = `—`**, not 100%. |
| 16 | `/reflection` | Weekly Reflection | Multiple Pending Weeks; any eligible past week may be finalized out of order. |

### 10.1 UI behavior rules

- Do not fabricate analytics: use actual saved data, or clearly show unavailable/empty states.
- **No Confirmed Plan** and **No Actual Data** are distinct and can coexist.
- Finalization is not available for the current week.
- A Finalized status must always be server-confirmed; do not optimistically display permanent success.
- The `Your Reflection` panel must expose the three approved questions and autosave status.
- A finalization conflict and a Draft revision conflict are separate error classes with separate recovery paths.
- The correction to Screen 15 supersedes the original mockup's erroneous 100% Unplanned Attention.
- The "History" tab shown in mockups has no approved content and is not an MVP requirement; past weeks are reached through `/reflection` (A7).

## 11. Cross-epic Integration and Invariants

### EPIC-04 — Contributions

- Historical Contributions can be added/edited/deleted only while the relevant week is not finalized and all EPIC-04 eligibility rules are satisfied.
- Cross-week date edits must check **both affected weeks**; a finalized source or destination week prevents an invalid historical mutation.
- Late additions to an unfinalized week recalculate Reflection Actual Attention.
- Contribution duration limits, future-date restrictions, and archived Goal/Project restrictions remain owned by EPIC-04.

### EPIC-05 — Progress Tracking

- Progress Events are independent of Contributions; neither implies the other.
- Historical Start/End values use event timestamps and fixed week boundaries, not current Goal progress.
- Reflection reads historical events; it never synthesizes events or modifies progress.
- Any operation that would alter historical events governed by a finalized week must be rejected.

### EPIC-06 — Weekly Focus

- Original is the first confirmed version; Current is the latest confirmed version.
- Historical plans are already read-only for planning; Reflection does not permit retrospective plan creation or version changes.
- Goals present in historical plans remain eligible for review even if currently Completed or Archived.
- The fixed timezone per week is shared with Reflection.

### EPIC-07 — Alignment Dashboard

- Both surfaces use the same tracked-minute denominator, baseline-dependent Focus/Unplanned classification, percentage rounding, and No Actual Data semantics.
- Dashboard navigation to Reflection retains the selected week.
- A finalized week remains available for historical Dashboard viewing without permitting mutations.
- Reflection does not invent an Alignment Score.

## 12. Engineering Acceptance Notes (Implementation Guidance, Not Additional Product Decisions)

The following are implementation-level recommendations rather than additional approved business decisions:

- Use a server-authoritative week identifier and revision/version for Draft writes; use a consistent read snapshot or version vector for review and finalize confirmation.
- Ensure mutation endpoints and finalization coordinate through database transactions/locks or equivalent concurrency control, including cross-week Contribution edits.
- Derive historical progress at the fixed local-week boundaries converted to instants; define deterministic ordering for Progress Events with identical timestamps (e.g., timestamp plus stable ID).
- Ensure idempotency across retries, including ambiguous network outcomes, and return the authoritative finalization status.
- Preserve accessibility: keyboard-operable confirmation dialog, error/status announcements, visible disabled states, and clear focus management.
- The precise autosave debounce, exact backend DTOs, lock strategy, and tie-break ordering are technical-design details, not new product decisions.

## 13. Final Acceptance Checklist

- [x] Product Discovery: **32 approved decisions**.
- [x] User Flows: **16 defined**.
- [x] Acceptance Criteria: **45 defined**.
- [x] Desktop UI States: **16 approved**, with corrections incorporated.
- [x] Cross-epic compatibility reviewed against EPIC-04–07.
- [x] Manual-only, atomic, idempotent, irreversible finalization specified.
- [x] Historical timezone, progress, missing-plan, missing-activity, and conflict rules specified.

**Final status: EPIC-08 — Design Approved.** Implementation is a separate phase; this document is the agreed product/design specification, not evidence that the feature has been implemented.


## Shared MVP mobile release gate (BRD NFR-006, D9)

Responsive web, no native app. Reflection (review, answers, Finalize) must be fully usable at 360 px width; no screen has horizontal page scroll at 360 px. Desktop mockups stay the visual reference; no separate mobile mockups are required.

## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Defined "first week of app use" | A2 |
| Mockup "History" tab declared out of scope | A7 |
| 2026-11-10: account-deletion exception; mobile release gate | D6, BR-029, D9 (NFR-006) |
