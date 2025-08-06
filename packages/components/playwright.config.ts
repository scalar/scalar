import { defineConfig } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: '**/*.e2e.ts',
  reporter: [['list'], ['html', { open: 'on-failure' }]],

  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      stylePath: './.storybook/snapshot.css',
      maxDiffPixelRatio: 0.03,
    },
  },

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
