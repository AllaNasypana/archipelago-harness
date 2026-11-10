import { defineConfig } from 'vitest/config';

export default defineConfig({
  // Resolves the `@/*` alias from tsconfig.json (Vite 8 option).
  resolve: { tsconfigPaths: true },
  test: {
    globals: true,
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.spec.{ts,tsx}'],
  },
});
