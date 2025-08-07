import { defineConfig } from '@playwright/test'

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: '**/*.e2e.ts',
  reporter: [['list'], ['html', { open: 'on-failure' }]],

  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      stylePath: './.storybook/snapshot.css',
      maxDiffPixelRatio: 0.001,
    },
  },

  webServer: [
    /**
     * Playwright Test Server
     *
     * This runs the playwright test browser(s) in a docker container to make sure
     * the tests are run in a consistent environment locally and in CI.
     */
    {
      name: 'Playwright',
      command: 'pnpm test:e2e:playwright',
      url: 'http://localhost:5001',
      timeout: 120 * 1000,
      reuseExistingServer: !process.env.CI,
    },
    /**
     * Storybook
     *
     * This runs the storybook built storybook files from `pnpm build:storybook`
     * unless you're already running the storybook dev server.
     */
    {
      name: 'Storybook',
      command: 'pnpm preview',
      url: 'http://localhost:5100',
      reuseExistingServer: !process.env.CI,
    },
  ],
  use: {
    /** The base URL is on the docker host where we're running storybook */
    baseURL: 'http://host.docker.internal:5100/',
    /** Use a smaller viewport for components */
    viewport: { width: 640, height: 480 },
  },
})
