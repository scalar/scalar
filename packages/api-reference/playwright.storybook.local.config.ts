import { defineConfig } from '@playwright/test'

/**
 * Local-only variant of playwright.storybook.config.ts.
 *
 * Skips the Docker browser-server entirely (org policy blocks the image) and
 * connects straight to a locally-served Storybook preview.  Run with:
 *
 *   pnpm preview:storybook   # in one terminal (serves storybook-static on :6006)
 *   npx playwright test -c playwright.storybook.local.config.ts --update-snapshots --grep LazyBus
 */
export default defineConfig({
  testMatch: 'src/**/*.snapshot.e2e.ts',
  workers: '100%',
  fullyParallel: true,
  reporter: [['list'], ['html', { open: 'on-failure' }]],
  webServer: {
    name: 'Storybook',
    command: 'pnpm preview:storybook',
    url: 'http://localhost:6006',
    reuseExistingServer: true,
    timeout: 120 * 1000,
  },
  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      scale: 'device',
      maxDiffPixelRatio: 0.001,
    },
    timeout: 15000,
  },
  use: {
    baseURL: 'http://localhost:6006/',
    viewport: { width: 800, height: 600 },
    screenshot: { mode: 'only-on-failure' },
  },
})
