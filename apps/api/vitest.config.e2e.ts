import { defineConfig } from 'vitest/config';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    root: './',
    include: ['**/*.e2e-spec.ts'],
    // AppModule connects to the database: needs `pnpm db:up` and apps/api/.env.
    setupFiles: ['dotenv/config'],
  },
});
