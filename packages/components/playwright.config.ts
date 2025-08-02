import { defineConfig } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: '**/*.e2e.ts',

  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',

  webServer: {
    command: 'pnpm preview',
    url: 'http://localhost:5101',
    reuseExistingServer: !process.env.CI,
  },
  use: {
    baseURL: 'http://localhost:5101/',
    // Use a smaller viewport for components
    viewport: { width: 640, height: 480 },
  },
})
