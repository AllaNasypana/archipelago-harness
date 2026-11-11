---
artifact_type: epic_decisions
epic: EPIC-01
version: 1
updated_at: 2026-11-11T00:00:00Z
produced_by: backlog-sync
---

# EPIC-01 — Decisions

Migrated from the slice's Q1–Q8, accepted by the human on 2026-11-09 (Q8: 2026-11-10).

### D-01-01 — Onboarding steps

- **Status:** DECIDED
- **Decision:** Not in this backlog. After EPIC-02/03/06 are sliced, EPIC-01 backlog v2 adds one web story per step (Project, Goal, Weekly Focus), each depending on that epic's create API, plus the Welcome "Create First Project" button. Covers ONB-AC-04 (button), 07…22, 24, UI-AC-08.
- **Source:** human, 2026-11-09, slice review
- **Affects:** EPIC-01 backlog

### D-01-02 — Dashboard after onboarding

- **Status:** DECIDED
- **Decision:** ONB-AC-25…28 are covered by the EPIC-07 Dashboard backlog; US-00-04-web ships only a placeholder Dashboard.
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-00-04-web

### D-01-03 — Technical decisions from epic §9

- **Status:** DECIDED
- **Decision:** Settled in CLARIFICATION / SPECIFICATION of US-01-01-api and US-01-04-api; a session-versioning ADR is approved before the US-01-01-api spec is approved.
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-01-01-api, US-01-04-api

### D-01-04 — Email language

- **Status:** DECIDED
- **Decision:** Emails use the UI locale of the triggering request, `en` fallback (US-00-02-api, US-01-06-api, US-01-09-api).
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-00-02-api, US-01-06-api, US-01-09-api

### D-01-05 — Language toggle on auth pages

- **Status:** DECIDED
- **Decision:** The EN/УКР toggle is also shown top-right on the auth layout (US-00-03-web).
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-00-03-web

### D-01-06 — Email status location

- **Status:** DECIDED
- **Decision:** On `/account` (US-01-08-web); the rest of Account/Settings is EPIC-09.
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-01-08-web

### D-01-07 — Profile menu

- **Status:** DECIDED
- **Decision:** Log out only for now; other items arrive with their EPIC-09 pages (US-00-04-web).
- **Source:** human, 2026-11-09, slice review
- **Affects:** US-00-04-web

### D-01-08 — Google sign-in

- **Status:** DECIDED
- **Decision:** Added as US-01-11-api/web after D18–D21; flow per ADR-002 (proposed — approve before the US-01-11-api spec). Account-page parts (GOOG-08) belong to EPIC-09. ---
- **Source:** human, 2026-11-10, slice review
- **Affects:** US-01-11-api
