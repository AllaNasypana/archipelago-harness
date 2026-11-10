# ADR-003 — React Compiler in `apps/web`

- **Status:** Accepted (2026-11-10)
- **Deciders:** project owner
- **Related:** AGENTS.md §5 (dependencies), `apps/web/docs/web-patterns.md` §1

## Context

Manual memoization (`useMemo`, `useCallback`, `React.memo`) adds noise, is easy to get wrong and
is hard to review. Next.js 16 supports the React Compiler, which memoizes components and hooks
automatically at build time.

## Decision

1. Enable `reactCompiler: true` in `apps/web/next.config.ts`.
2. Add the dev dependency `babel-plugin-react-compiler`, pinned to an exact version
   (required by Next.js to run the compiler).
3. Code rules (in `apps/web/docs/web-patterns.md` §1):
   - no manual memoization for render performance;
   - components and hooks follow the Rules of React (pure render, no mutation, hooks at the top
     level);
   - `"use no memo"` only as a temporary opt-out for a proven compiler issue, with a comment.
4. The experimental `experimental.turbopackRustReactCompiler` is not enabled; revisit when it is
   stable.

## Consequences

- Simpler components; reviewers flag unnecessary `useMemo`/`useCallback`/`memo`.
- Slightly slower builds: Next.js runs the Babel plugin only on files with JSX or hooks.
- Code that breaks the Rules of React is skipped by the compiler without an error, so those rules
  are checked in review.
- Rollback: set `reactCompiler: false`; no code changes are required.
