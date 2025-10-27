import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'

type WebServer = PlaywrightTestConfig['webServer']

const CI = Boolean(process.env.CI)
const isLinux = process.platform === 'linux' && !CI

/** Linux uses the host network to connect to the dev server */
const network = isLinux ? 'host' : 'bridge'

/**
 * Playwright Test Server
 *
 * This runs the playwright test browser(s) in a docker container to make sure
 * the tests are run in a consistent environment locally and in CI.
 */
const playwrightServer: WebServer = {
  name: 'Playwright',
  command: `NETWORK=${network} pnpm test:e2e:playwright`,
  url: 'http://localhost:5001',
  timeout: 120 * 1000,
  reuseExistingServer: !CI,
  gracefulShutdown: {
    signal: 'SIGINT',
    timeout: 10 * 1000,
  },
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: 'test/**/*.e2e.ts',
  workers: '100%',
  reporter: CI
    ? [['list'], ['html', { open: 'never' }], ['json', { outputFile: 'playwright-results.json' }]]
    : [['list'], ['html', { open: 'always' }]],

  snapshotPathTemplate: './test/snapshots/reference/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // Use device pixels for for higher DPI screenshots
      scale: 'device',
      // Allow for small differences in the screenshot (1% of the total pixels)
      maxDiffPixelRatio: 0.01,
    },
    timeout: 15000,
  },

  /**
   * In CI the container is the playwright server itself
   *
   * @see https://playwright.dev/docs/ci#via-containers
   */
  webServer: CI ? undefined : playwrightServer,
  use: {
    /** The base URL is on the docker host where we're running Vite */
    baseURL: CI || isLinux ? 'http://localhost:5173/' : 'http://host.docker.internal:5173/',
    /** Set a higher device scale factor for higher DPI screenshots */
    deviceScaleFactor: 2,
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
