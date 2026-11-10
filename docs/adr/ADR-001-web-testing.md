# ADR-001 — Testing in `apps/web`

- **Status:** Accepted (2026-11-09)
- **Deciders:** project owner
- **Related:** AGENTS.md §6, `docs/workflow/stages.md` OQ-4

## Context

`apps/api` already tests with Vitest. `apps/web` had no test runner, so the `TEST_WRITING`
stage could not produce tests for `web` stories. The owner requires tests for web hooks and
client-side logic, not only for the API.

"Logic" in web means UI logic only: form schemas, formatting, derived display state, hooks,
BFF request mapping. Business rules stay in NestJS (AGENTS.md §3.2) and are tested there.

## Decision

1. **Vitest + Testing Library** for unit, hook and component tests in `apps/web`.
   - Same runner, versions and conventions as `apps/api`: `*.spec.ts(x)` next to the code,
     Vitest globals, `pnpm test`.
   - `jsdom` environment; `@testing-library/react` (`render`, `renderHook`),
     `@testing-library/user-event`, `@testing-library/jest-dom` matchers.
   - Config: `apps/web/vitest.config.ts`; setup: `apps/web/src/test/setup.ts`.
2. **What must be tested in a `web` story:**
   - pure functions and Zod schemas (valid and invalid cases, boundaries);
   - custom hooks via `renderHook`, including TanStack Query hooks with a test `QueryClient`;
   - components with behavior (validation messages, disabled states, empty/error states),
     queried by role and accessible name, not by CSS class;
   - BFF route handlers: request mapping and error mapping, with the NestJS client mocked.
3. **Playwright** for a few end-to-end journeys (sign in, add a Contribution, finalize a week).
   Added by the first story that delivers such a journey, not before.

## Consequences

- `test-writer` and `next-implementor` know the tools before the first `web` story.
- Server Components that only compose data are covered by e2e, not by unit tests.
- Password-policy test vectors are shared between Zod (web) and `class-validator` (api) as
  AGENTS.md §6 requires; both run on Vitest.
