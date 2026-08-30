/**
 * Vitest config for dsh-qr-share.
 *
 * - Uses happy-dom so the client-half tests can render React components
 *   (QrDialog touches window, document, URL, canvas, keydown).
 * - Loads `./src/test/setup.ts` once per file to register @testing-library
 *   jest-dom matchers and any global polyfills the suites need.
 * - Keeps the same tsconfig as the build (`./tsconfig.json`) so `tsc -p
 *   tsconfig.build.json` and `vitest run` see the same source graph.
 * - Test files matching `*.test.ts` / `*.test.tsx` are picked up
 *   automatically by vitest's default include glob (see the
 *   `include` key below for the exact pattern we declare).
 *
 * The host half is excluded by being in a separate directory tree from
 * any test file we author; host tests, if added later, can be guarded
 * with `// @vitest-environment node` at the top of the file.
 */
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'happy-dom',
    globals: false,
    setupFiles: ['./src/test/setup.ts'],
    include: ['src/**/*.{test,spec}.{ts,tsx}'],
    css: false,
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'lcov'],
      include: ['src/**/*.ts', 'src/**/*.tsx'],
      exclude: ['src/**/*.test.{ts,tsx}', 'src/test/**'],
    },
  },
})