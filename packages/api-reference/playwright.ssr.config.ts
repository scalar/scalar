import { defineConfig } from '@playwright/test'

/** Tests the built server renderer and standalone browser bundle together. Run build:packages first. */
export default defineConfig({
  testDir: './playwright/test',
  testMatch: 'ssr-hydration.e2e.ts',
  workers: 1,
  use: { viewport: { width: 1440, height: 1000 }, screenshot: 'only-on-failure' },
})
