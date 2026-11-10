# EPIC-02 — Projects Management

**Product:** Archipelago  
**Mockups:** [`docs/design/mockups/epic-02-projects/`](../design/mockups/epic-02-projects/) — index with sources and corrections: [design/README.md](../design/README.md#epic-02--projects)  
**Document type:** MVP functional specification  
**Language:** English  
**Status:** Business Rules, User Flows and Desktop Design Approved; implementation contracts proposed where noted  
**Dependencies:** EPIC-01 Authentication & User Onboarding; EPIC-03 Goals; EPIC-04 Contributions; EPIC-05 Progress Tracking; EPIC-06 Weekly Focus; EPIC-08 Weekly Reflection

## 1. Purpose and outcomes

Projects represent the user's major areas of importance and group related Goals. This epic enables authenticated users to create, browse, view, edit, archive and restore Projects in their personal Workspace, without deleting historical information or retroactively modifying weekly plans.

### In scope
- Create a Project with validated Name, Priority and optional Description.
- List Projects in a compact table; filter Active / Archived / All; sort by Priority then Name.
- View Project details and associated Goals.
- Edit active Projects.
- Archive with explicit confirmation; view archived Projects read-only; restore without confirmation.
- Support empty, loading, validation, conflict and server-error UI states.
- Enforce Workspace authorization and archive restrictions on the server.

### Out of scope
- Deleting Projects in the MVP.
- Project Roles, team collaboration or invitations.
- Automatically changing Goal states on Project archive/restore.
- Automatically removing or changing Weekly Focus entries on Project archive/restore.
- Fabricated or unsupported aggregate Project Progress and Activity metrics.
- Detailed Goal CRUD, Contribution and Progress workflows (covered by their respective epics).

## 2. Approved business rules

| ID | Rule |
|---|---|
| PRJ-BR-001 | A Project belongs to a Workspace and groups Goals. |
| PRJ-BR-002 | Projects List is a table with Name, Priority, Goals Count and Actions. |
| PRJ-BR-003 | Default ordering is Priority P1 → P2 → P3, then Name A–Z within each Priority. |
| PRJ-BR-004 | Projects List provides Active, Archived and All filters; Active is the default when no filter is specified (D14). |
| PRJ-BR-005 | Project Details shows Project information and associated Goals, without an additional Activity tab. |
| PRJ-BR-006 | The MVP allows Archive and Restore, but not Delete. |
| PRJ-BR-007 | Name, Description and Priority of an Active Project can be edited at any time. |
| PRJ-BR-008 | Project Name is required, trimmed, and 2–100 characters long after trimming. |
| PRJ-BR-009 | Project Name is unique within a Workspace, ignoring case and surrounding whitespace; names of Archived Projects remain reserved (D10). |
| PRJ-BR-010 | Description is optional, maximum 1,000 characters. |
| PRJ-BR-011 | Priority is required: P1, P2 or P3; no value is preselected during creation. |
| PRJ-BR-012 | Goals Count includes every associated Goal, including archived Goals. |
| PRJ-BR-013 | Archiving a Project preserves each Goal's own status and archive state. |
| PRJ-BR-014 | While the parent Project is archived, creating Goals, adding Contributions and changing Goal Progress are blocked. |
| PRJ-BR-015 | Archived Projects are read-only; restore before editing. |
| PRJ-BR-016 | Archive requires a confirmation dialog explaining consequences for Goals, Contributions and Weekly Focus. |
| PRJ-BR-017 | Goals belonging to an archived Project remain in the current Weekly Focus, marked Archived with a warning; plans are not automatically changed. |
| PRJ-BR-018 | Restoring a Project makes it Active, preserves each Goal's own state, and does not automatically modify Weekly Focus. |
| PRJ-BR-019 | Changing Project Priority affects current attention recommendations, but does not rewrite saved Weekly Plan versions. |
| PRJ-BR-020 | Archiving/restoring does not delete Contributions, Progress Events or historical/finalized Weekly Reflections. |
| PRJ-BR-021 | After Create Project, navigate to Project Details. |
| PRJ-BR-022 | After Save Changes, navigate to Project Details with a success message. |
| PRJ-BR-023 | Restore requires no confirmation; show a success notification when complete. |

**Priority representation:** P1–P3 are the approved UI labels; integer persistence follows the architecture baseline. Mapping and API representations are to be defined in implementation contracts.

## 3. Project lifecycle and operation matrix

Project lifecycle: **Active ⇄ Archived**. No Delete transition in the MVP.

| Operation | Active Project | Archived Project |
|---|---|---|
| View Project and Goals | Allowed | Allowed (read-only) |
| Edit Name / Description / Priority | Allowed | Blocked until Restore |
| Create Goal | Allowed | Blocked |
| Add Contribution to a Goal | Subject to Goal/week rules | Blocked |
| Change Goal Progress | Subject to Goal rules | Blocked |
| Archive | Allowed with confirmation | Not applicable |
| Restore | Not applicable | Allowed immediately |
| Delete | Not supported | Not supported |

An archived parent does not overwrite a child's own status. After restoration, an individually archived Goal remains archived. Operations also remain subject to Goal status and weekly finalization rules.

## 4. Approved desktop routes and navigation

| Screen / state | URL | Navigation and behavior |
|---|---|---|
| Projects List (Active / Archived / All; Empty / Loading / Error) | `/projects` | Open a Project or Create Project. |
| Create Project (Default / Validation / Duplicate / Loading / Error) | `/projects/create` | Success → `/projects/[id]`. |
| Project Details (Active) | `/projects/[id]` | View information and Goals; Edit and Archive actions. |
| Edit Project (Default / Validation / Loading / Error) | `/projects/[id]/edit` | Save or Cancel → `/projects/[id]`. |
| Archive Confirmation | `/projects/[id]` | Modal dialog; Cancel preserves Active; Confirm archives. |
| Project Details (Archived / read-only) | `/projects/[id]` | View Goals and Restore action; no Edit/Create Goal. |
| Restore Success | `/projects/[id]` | Restored Active state and success notification. |

The Next.js `(app)` route group, if used, is not part of the public URL. Example IDs/domains in mockups are illustrative, not production commitments. **Every future Archipelago mockup must display URL, screen name and UI state.**

Suggested App Router structure:

```text
apps/web/src/app/(app)/projects/
├── page.tsx
├── create/page.tsx
└── [id]/
    ├── page.tsx
    └── edit/page.tsx
```

## 5. User flows

### UF-01 — Create Project
1. Authenticated user opens `/projects` and selects **Create Project**, or arrives from first-time onboarding.
2. Navigate to `/projects/create`; Name and Description are blank; Priority has no default selection.
3. User enters Name, explicitly selects P1/P2/P3, optionally enters Description.
4. Client validates; server independently validates Workspace access, field rules and name uniqueness.
5. On success, Project is Active and user navigates to `/projects/[id]`.
6. On validation or duplicate-name error, preserve entered values and show inline feedback; on server failure, show a recoverable error without claiming success.

### UF-02 — Browse, filter and open Projects
1. Open `/projects`; display the table with Name, Priority, Goals Count and Actions.
2. Apply Active / Archived / All filter.
3. Default order is Priority P1→P3, then Name A–Z.
4. Open a Project at `/projects/[id]`; show its details and all associated Goals with their own statuses.

### UF-03 — Edit an Active Project
1. From `/projects/[id]`, select **Edit** → `/projects/[id]/edit`.
2. Edit Name, Description and/or Priority.
3. Validate the same constraints as creation; submit.
4. On success, return to Details and show a success message.
5. Changing Priority updates current recommendations but does not rewrite saved plan versions.
6. If the Project has become Archived before save, reject the update and show its current state.

### UF-04 — Archive Project
1. From Active Project Details, select **Archive**.
2. Show a confirmation dialog describing: existing Goals retain their statuses; no new Goals/Contributions/progress changes while archived; current Weekly Focus entries remain with an Archived warning.
3. **Cancel** closes dialog with no mutation.
4. **Archive Project** marks the Project Archived; historical records and plan versions are preserved.
5. Details becomes read-only and offers Restore.

### UF-05 — View Archived Project
1. Open Archived filter or direct authorized `/projects/[id]` URL.
2. Display Archived status, Project information and associated Goals (including their independent statuses).
3. Do not offer edit/create operations; server rejects attempted mutations.

### UF-06 — Restore Project
1. From Archived Project Details, select **Restore**.
2. Restore executes immediately, without confirmation.
3. Project becomes Active; show **Project restored** success notification.
4. Goals retain their individual statuses; Weekly Focus and finalized history remain unchanged.

## 6. Acceptance criteria

### 6.1 Create and validation
- **PRJ-AC-001:** Only an authenticated, authorized Workspace member may create a Project in that Workspace.
- **PRJ-AC-002:** Name is required, trimmed, and contains 2–100 characters after trimming.
- **PRJ-AC-003:** Names are unique per Workspace after case-insensitive comparison and trimming; uniqueness is enforced against concurrent requests.
- **PRJ-AC-004:** Description is optional and at most 1,000 characters.
- **PRJ-AC-005:** Priority must be explicitly selected from P1/P2/P3; no default value is selected in Create.
- **PRJ-AC-006:** Invalid inputs show inline errors; server validation is authoritative.
- **PRJ-AC-007:** A successful Create yields an Active Project and redirects to Project Details.
- **PRJ-AC-008:** Loading state prevents duplicate submission from repeated clicks; a server failure does not show a false success state.

### 6.2 List and details
- **PRJ-AC-009:** Projects List displays Name, Priority, Goals Count and Actions.
- **PRJ-AC-010:** Default ordering is Priority P1→P2→P3 and then Name A–Z.
- **PRJ-AC-011:** Active / Archived / All filters work and Archived Projects remain discoverable.
- **PRJ-AC-012:** Goals Count includes archived Goals.
- **PRJ-AC-013:** Project Details displays Project information and associated Goals, without an Activity tab or fabricated aggregate progress.
- **PRJ-AC-014:** An authorized user can view Archived Project Details read-only.
- **PRJ-AC-015:** Empty, loading and server-error states are displayed appropriately.

### 6.3 Edit
- **PRJ-AC-016:** Name, Description and Priority can be edited while Project is Active.
- **PRJ-AC-017:** Editing applies the same name, description, uniqueness and priority rules as creation.
- **PRJ-AC-018:** Updating a Project does not change its ID or its Goal associations.
- **PRJ-AC-019:** On success, navigate to Details and show a success message.
- **PRJ-AC-020:** An Archived Project cannot be edited, including by direct API request.
- **PRJ-AC-021:** Priority changes update current recommendations without rewriting stored Weekly Plan versions.

### 6.4 Archive
- **PRJ-AC-022:** Archive is available only for Active Projects.
- **PRJ-AC-023:** Archive requires a confirmation dialog explaining impact on Goals, Contributions, Progress and Weekly Focus.
- **PRJ-AC-024:** Canceling confirmation does not change the Project.
- **PRJ-AC-025:** Archiving preserves Goal statuses and each Goal's own archive flag.
- **PRJ-AC-026:** While archived, the Project cannot accept new Goals, new Contributions or Goal Progress updates.
- **PRJ-AC-027:** Goals already in Weekly Focus remain in place and display Archived status/warning.
- **PRJ-AC-028:** Archive does not delete or rewrite Contributions, Progress Events, saved Weekly Plans or finalized Reflections.
- **PRJ-AC-029:** Archived Project Details is read-only and offers Restore.

### 6.5 Restore
- **PRJ-AC-030:** Restore is available for Archived Projects and requires no confirmation dialog.
- **PRJ-AC-031:** Restore changes the Project to Active and shows a success notification.
- **PRJ-AC-032:** Restore does not change individual Goal states or automatically change Weekly Focus.
- **PRJ-AC-033:** After Restore, editing and Goal operations are available only insofar as their own business rules permit.
- **PRJ-AC-034:** Restore does not rewrite finalized historical records.

### 6.6 Security and consistency
- **PRJ-AC-035:** All Project operations require a valid authenticated session.
- **PRJ-AC-036:** NestJS verifies Workspace authorization and ownership/membership on every relevant operation; guessing an ID does not grant access.
- **PRJ-AC-037:** The backend enforces Archived restrictions regardless of UI state.
- **PRJ-AC-038:** Concurrent create/update operations cannot bypass per-Workspace name uniqueness.
- **PRJ-AC-039:** Delete Project is unavailable in MVP UI and public API.
- **PRJ-AC-040:** Failed requests preserve previously committed records and do not imply success.
- **PRJ-AC-041:** Changes to current Project state do not retroactively modify finalized weeks or stored plan versions.

## 7. Cross-epic compatibility contracts

### EPIC-03 — Goals Management
- Goals belong to a Project; Goal creation requires an Active parent Project.
- Project archive/restore must **not** cascade changes to Goal status or Goal archived flag.
- Effective permissions on a Goal depend on both its own state and its parent Project state.
- Details and Goals Count include archived Goals, preserving their individual statuses.

### EPIC-04 — Contributions and EPIC-05 — Progress Tracking
- An Archived Project blocks new Contributions and changes to Goal Progress, enforced on the NestJS side.
- Historical Contributions and Progress Events are retained.
- Additional Goal/week-specific edit restrictions remain governed by their respective epics; this epic does not override finalized-week immutability.

### EPIC-06 — Weekly Focus Planning
- Archiving a Project does not remove its Goals from an existing Weekly Focus or silently alter the current/saved plan.
- Such entries display Archived state and a warning.
- Priority changes may influence current attention recommendations, but Original Plan and other saved versions are not overwritten.
- Restoring a Project does not automatically rebuild Weekly Focus.

### EPIC-08 — Weekly Reflection & Finalization
- Archive/Restore and Priority edits do not change finalized Weekly Reflections or historical Contribution/Progress records.
- Historical views must remain faithful to the values and plan versions relevant to their period. The storage/snapshot approach is an implementation decision.

## 8. Architecture and API boundaries

### Approved architecture constraints
- **Next.js App Router BFF:** handles same-origin browser requests, page routing and server-side API access; does not become the source of business rules.
- **NestJS modular monolith:** sole authority for Project validation, authorization, state transitions and cross-module business invariants.
- **PostgreSQL + Prisma:** persistence for Projects and Workspace relationships; maintain concurrency-safe uniqueness.
- **Authentication:** browser holds only an opaque secure HttpOnly BFF session cookie; BFF keeps access/refresh credentials server-side, consistent with EPIC-01.
- **Inter-module boundaries:** use DTOs, IDs and application contracts; avoid direct cyclic module dependencies or shared mutable domain objects.

### Proposed API capabilities (not yet endpoint-approved)
| Capability | Suggested method/path | Notes |
|---|---|---|
| List/filter Projects | `GET /api/v1/projects` | Filter and ordering parameters to be defined |
| Create Project | `POST /api/v1/projects` | Workspace-scoped; validated fields |
| Get Project Details | `GET /api/v1/projects/:id` | Includes or separately fetches associated Goals |
| Update Project | `PATCH /api/v1/projects/:id` | Active only |
| Archive Project | `POST /api/v1/projects/:id/archive` | Active → Archived |
| Restore Project | `POST /api/v1/projects/:id/restore` | Archived → Active |

These paths are **proposals**, not approved implementation contracts. The public Next.js routes in Section 4 are approved. NestJS authorization must not trust client-provided Workspace IDs without server-side verification.

### Proposed persistence/validation considerations
- Normalize a comparison key for Project Name by trimming and case-folding according to a documented Unicode policy; ensure the database uniqueness constraint matches backend behavior.
- Scope the uniqueness key by Workspace; decide whether archived names remain reserved (not yet explicitly agreed).
- Apply optimistic or transactional safeguards to prevent stale edit/archive races.
- Coordinate archive restrictions through application contracts so Contributions/Progress cannot mutate Goals under an archived Project.
- Invalidate relevant client queries after Create, Edit, Archive and Restore.

## 9. Security and reliability

- Enforce authentication, Workspace authorization and server-side validation on every mutation.
- Prevent insecure direct object reference (IDOR) access to Projects and Goals across Workspaces.
- Use parameterized ORM operations and concurrency-safe uniqueness enforcement.
- Do not rely on disabled frontend controls for archive enforcement.
- Ensure state transitions are atomic; do not partially modify Project/Goal state during Archive/Restore.
- Protect BFF mutation requests against CSRF according to the chosen session-cookie architecture.
- Provide safe, non-sensitive API errors and log operational failures without exposing session tokens or secrets.
- Ensure saved Weekly Plan versions and finalized historical records are immutable under Project operations.

## 10. Desktop design inventory — approved with corrections

| # | Mockup | Route | Required states / annotations |
|---|---|---|---|
| 01 | Projects List | `/projects` | Active / Archived / All, sorting, Empty, Loading, Error |
| 02 | Create Project | `/projects/create` | Default, required Priority unselected, Validation, Duplicate Name, Loading, Error |
| 03 | Project Details | `/projects/[id]` | Active, Project information and Goals list, Edit, Archive |
| 04 | Edit Project | `/projects/[id]/edit` | Default, Validation, Duplicate Name, Loading, Error, Save success |
| 05 | Archive Confirmation | `/projects/[id]` | Modal warning, Cancel, Confirm, pending/error feedback |
| 06 | Archived Project Details | `/projects/[id]` | Archived badge, read-only, individual Goal statuses, Restore |
| 07 | Restore Success | `/projects/[id]` | Active state, success toast, preserved Goal statuses |

**Approved design corrections:** No Project Details Activity tab; do not fabricate aggregate progress; use full inline validation; retain archived Goals' own statuses; Restore requires no confirmation; include Empty/Error/Loading states. All mockups use the light Grafana-inspired Archipelago system (white/gray surfaces, orange accents, shared authenticated header and sidebar). URL, screen name and state are mandatory annotations for subsequent mockups.

## 11. QA scenario matrix

| Scenario | Expected result |
|---|---|
| Create `Health`, then ` health ` in same Workspace | Second rejected as duplicate |
| Archive `Health`, then create `Health` | Rejected: archived names stay reserved |
| Name is whitespace only | Required/min-length validation error |
| Name shorter than 2 or longer than 100 after trim | Validation error |
| Description exceeds 1,000 characters | Validation error |
| Create without Priority | Validation error |
| Multiple Projects have P1 | Sort by Name A–Z |
| Archived Project has archived Goals | Goals Count includes them |
| Archive Project containing Goals in current Weekly Focus | Keep entries, mark Archived and warn |
| Archive Project containing active Goals | Goal statuses unchanged; operations blocked |
| Attempt API update on Archived Project | Rejected by server |
| Restore Project with individually archived Goals | Project Active; those Goals remain archived |
| Change Project Priority P3→P1 | Current recommendations update; saved plan versions unchanged |
| Archive after weekly finalization | Finalized historical records unchanged |
| Concurrent create of same normalized Name | At most one succeeds in Workspace |
| Access another Workspace's Project ID | Denied |
| Cancel Archive dialog | Project remains Active |
| Restore Archived Project | Immediate restoration and success notification |

## 12. Definition of Done

- All approved Project lifecycle rules and page routes are implemented.
- Server-side authorization, validation, uniqueness and archived-state restrictions pass automated tests.
- All User Flows and Acceptance Criteria above pass QA.
- UI includes approved design states and responsive/accessibility behavior consistent with Archipelago design standards.
- Cross-epic tests verify no mutation of saved Weekly Plans, finalized Reflections or historical Contributions/Progress Events.
- OpenAPI contracts and generated clients are updated after endpoint approval.
- English is the default UI language; both English (en) and Ukrainian (uk) must be supported in the first MVP release. Implement localization-ready UI from the start; Ukrainian translation may be completed after core epics during MVP hardening, before launch.
- No Project Delete action or endpoint is exposed.

## 13. Open implementation decisions (not approved business rules)

1. ~~Archived Project names reserved?~~ — resolved: yes (PRJ-BR-009, D10).
2. Exact Unicode case-folding/normalization semantics and database constraint implementation.
3. Exact NestJS REST endpoints, request/response DTOs, pagination and filter parameter names.
4. Error codes, optimistic concurrency handling and idempotency policy for mutations.
5. Historical Priority snapshots/plan-version representation and cross-module contract details.
6. ~~Default filter on `/projects`~~ — resolved: Active (PRJ-BR-004, D14).
7. Specific handling of archive operations racing with in-flight Contribution/Progress requests.

---

**Approval boundary:** Product behavior, desktop routes and visual direction in this document reflect approved decisions. Proposed API/persistence details and Section 13 remain subject to architecture review.


## Shared MVP localization release gate (approved 2026-11-09)

The **first MVP release** must support both **English (`en`) and Ukrainian (`uk`)** user-interface localization. English is the default language. Core feature development may precede the Ukrainian translation pass, but the initial MVP cannot launch until both languages cover navigation, forms, validation, status and error messages, analytics, Weekly Focus, and Weekly Reflection. UI text must be externalized/localization-ready from initial implementation. User-authored Project/Goal names and Contribution descriptions are not translated automatically. This is a cross-epic release criterion, not a requirement to finish Ukrainian translation within each feature epic's initial development sprint.

## Revision log (2026-11-09, aligned with `archipelago-business-requirements.md` (BRD v0.4))

| Change | Decision / conflict |
|---|---|
| Archived Project names stay reserved; open decision 1 closed | D10 (Q11) |
| Active is the default filter; open decision 6 closed | D14 (Q15) |
