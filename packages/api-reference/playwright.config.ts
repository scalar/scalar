import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'

const IS_CDN = process.env.TEST_MODE === 'CDN'
const CI = Boolean(process.env.CI)
const isLinux = process.platform === 'linux' && !CI

/**
 * A list of reporters to use for the tests
 * @see https://playwright.dev/docs/test-reporters
 */
const reporter: PlaywrightTestConfig['reporter'] = [['list']]

if (CI) {
  // In CI we need to generate JSON and HTML reports for the GitHub Actions helpers
  if (IS_CDN) {
    reporter.push(
      // We suffix cdn the report and results when testing the CDN
      ['html', { open: 'never', outputFolder: 'playwright-report-cdn' }],
      ['json', { outputFile: 'playwright-results-cdn.json' }],
      // Makes sure the CDN tests always pass in CI
      ['./test-cdn/ci-reporter.ts'],
    )
  } else {
    reporter.push(
      ['html', { open: 'never', outputFolder: 'playwright-report' }],
      ['json', { outputFile: 'playwright-results.json' }],
    )
  }
} else {
  // Locally we just generate the HTML report in case there's a failure
  reporter.push(['html', { open: 'on-failure' }])
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: IS_CDN ? 'test/snapshots-cdn/**/*.e2e.ts' : ['test/features/*.e2e.ts', 'test/snapshots/**/*.e2e.ts'],
  workers: '100%',
  fullyParallel: true,
  reporter,
  /**
   * Outside of CI we run the playwright test server in a docker container for
   * consistent cross-platform results.
   */
  webServer: CI
    ? undefined
    : {
        name: 'Playwright',
        command: 'docker run --network=host -e PORT=5001 -p 5001:5001 scalarapi/playwright:1.56.0',
        url: 'http://localhost:5001',
        timeout: 120 * 1000,
        reuseExistingServer: !CI,
        gracefulShutdown: {
          signal: 'SIGINT',
          timeout: 10 * 1000,
        },
      },
  snapshotPathTemplate: '{testFileDir}/{testFileName}.snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Use device pixels for for higher DPI screenshots
      scale: 'device',
      maxDiffPixelRatio: 0.01,
    },
    timeout: 15000,
  },
  use: {
    /** The base URL is on the docker host where we're running Vite */
    baseURL: CI || isLinux ? 'http://localhost:5173/' : 'http://host.docker.internal:5173/',
    /** Set a higher device scale factor for higher DPI screenshots */
    deviceScaleFactor: 2,
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
