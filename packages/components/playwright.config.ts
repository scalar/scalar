import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'

type WebServer = PlaywrightTestConfig['webServer']

const CI = !!process.env.CI

const isLinux = process.platform === 'linux' && !CI

/**
 * Playwright Test Server
 *
 * This runs the playwright test browser(s) in a docker container to make sure
 * the tests are run in a consistent environment locally and in CI.
 */
const playwrightServer: WebServer = {
  name: 'Playwright',
  command: 'pnpm test:e2e:playwright',
  url: 'http://localhost:5001',
  timeout: 120 * 1000,
  reuseExistingServer: !CI,
  gracefulShutdown: {
    signal: 'SIGTERM',
    timeout: 10 * 1000,
  },
} as const

/**
 * Storybook
 *
 * This runs the storybook built storybook files from `pnpm build:storybook`
 * unless you're already running the storybook dev server.
 */
const storybookServer: WebServer = {
  name: 'Storybook',
  command: 'pnpm preview',
  url: 'http://localhost:5100',
  reuseExistingServer: !CI,
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: '**/*.e2e.ts',
  reporter: CI
    ? [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-results.json' }]]
    : [['list'], ['html', { open: 'on-failure' }]],

  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // Use device pixels for for high DPI screenshots
      scale: 'device',
      // Allow for small differences in the screenshot (0.1% of the total pixels)
      maxDiffPixelRatio: 0.001,
    },
  },

  /**
   * In CI we only need the storybook server because the CI container is the playwright server
   *
   * @see https://playwright.dev/docs/ci#via-containers
   */
  webServer: CI ? [storybookServer] : [playwrightServer, storybookServer],
  workers: '100%',
  use: {
    /** The base URL is on the docker host where we're running Vite */
    baseURL: CI || isLinux ? 'http://localhost:5100/' : 'http://host.docker.internal:5100/',
    /** Use a smaller viewport for components */
    viewport: { width: 640, height: 480 },
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
