import { defineConfig, type PlaywrightTestConfig } from '@playwright/test'
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

/**
 * Vite Dev Server
 */
const devServer: WebServer = {
  name: 'Vite',
  command: 'pnpm dev',
  url: 'http://localhost:5173',
  reuseExistingServer: !CI,
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: 'test-snapshots/**/*.e2e.ts',
  workers: '100%',
  reporter: CI
    ? [
        ['list'],
        ['html', { open: 'never' }],
        ['json', { outputFile: 'playwright-results.json' }],
        ['./test-snapshots/ci-reporter.ts'],
      ]
    : [['list'], ['html', { open: 'always' }]],

  snapshotPathTemplate: './test-snapshots/.snapshots/{arg}{ext}',

  expect: {
    toHaveScreenshot: {
      // Allow for small differences in the screenshot (1% of the total pixels)
      maxDiffPixelRatio: 0.01,
    },
  },

  /**
   * In CI we only need the storybook server because the CI container is the playwright server
   *
   * @see https://playwright.dev/docs/ci#via-containers
   */
  webServer: CI ? [devServer] : [playwrightServer, devServer],
  use: {
    /** The base URL is on the docker host where we're running Vite */
    baseURL: CI || isLinux ? 'http://localhost:5173/' : 'http://host.docker.internal:5173/',
    /** Save a screenshot on failure */
    screenshot: { mode: 'on' },
  },
})
