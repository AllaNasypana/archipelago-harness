import { defineConfig } from 'vitest/config';

// Integration tests (`*.int-spec.ts`) need the local database: `pnpm db:up` and apps/api/.env.
export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.int-spec.ts'],
    setupFiles: ['dotenv/config'],
    fileParallelism: false,
  },
});
