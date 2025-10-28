import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'

const IS_CDN = process.env.TEST_MODE === 'CDN'
const CI = Boolean(process.env.CI)
const isLinux = process.platform === 'linux' && !CI

/** Linux uses the host network to connect to the dev server */
const network = isLinux ? 'host' : 'bridge'

const servers: Exclude<NonNullable<PlaywrightTestConfig['webServer']>, any[]>[] = [
  {
    name: 'Vite',
    command: 'pnpm dev',
    url: 'http://localhost:5173',
    reuseExistingServer: !CI,
  },
]
const reporter: PlaywrightTestConfig['reporter'] = [['list']]

/**
 * Outside of CI we run the playwright test server in a docker container for
 * consistent cross-platform results.
 */
if (!CI) {
  servers.push({
    name: 'Playwright',
    command: `NETWORK=${network} docker run --network=host -e PORT=5001 -p 5001:5001 scalarapi/playwright:1.56.0`,
    url: 'http://localhost:5001',
    timeout: 120 * 1000,
    reuseExistingServer: !CI,
    gracefulShutdown: {
      signal: 'SIGINT',
      timeout: 10 * 1000,
    },
  })
}

/**
 * When not running the CDN tests we run the Vite dev server
 * and report the results to the playwright-report directory.
 */
if (!IS_CDN) {
  if (CI) {
    reporter.push(
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ['json', { outputFile: 'playwright-results.json' }],
    )
  }
}

/**
 * When running the CDN tests we report the results to the playwright-report-cdn directory.
 */
if (IS_CDN) {
  if (CI) {
    reporter.push(
      ['html', { open: 'never', outputFolder: 'playwright-report-cdn' }],
      ['json', { outputFile: 'playwright-results-cdn.json' }],
    )
  }
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: IS_CDN ? 'test/snapshots-cdn/**/*.e2e.ts' : ['test/features/*.e2e.ts', 'test/snapshots/**/*.e2e.ts'],
  workers: '100%',
  fullyParallel: true,
  reporter,
  snapshotPathTemplate: '{testFileDir}/{testFileName}.snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Use device pixels for for higher DPI screenshots
      scale: 'device',
      maxDiffPixelRatio: 0.01,
    },
    timeout: 15000,
  },
  webServer: servers,
  use: {
    /** The base URL is on the docker host where we're running Vite */
    baseURL: CI || isLinux ? 'http://localhost:5173/' : 'http://host.docker.internal:5173/',
    /** Set a higher device scale factor for higher DPI screenshots */
    deviceScaleFactor: 2,
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
