import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'

const CI = Boolean(process.env.CI)
const isLinux = process.platform === 'linux' && !CI

/**
 * A list of reporters to use for the tests
 * @see https://playwright.dev/docs/test-reporters
 */
const reporter: PlaywrightTestConfig['reporter'] = [['list']]

if (CI) {
  reporter.push(
    ['html', { open: 'never', outputFolder: 'playwright-report' }],
    ['json', { outputFile: 'playwright-results.json' }],
  )
} else {
  reporter.push(['html', { open: 'on-failure' }])
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  testMatch: 'test/snapshots/**/*.e2e.ts',
  workers: '100%',
  fullyParallel: true,
  reporter,
  snapshotPathTemplate: '{testFileDir}/{testFileName}.snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      // Use device pixels for higher DPI screenshots
      scale: 'device',
      // Allow for 0.1% difference in pixels
      maxDiffPixelRatio: 0.001,
    },
    timeout: 15000,
  },
  use: {
    /** The base URL points to the Vite dev server (api-client uses port 5065) */
    baseURL: 'http://localhost:5065/',
    /** Set a higher device scale factor for higher DPI screenshots */
    deviceScaleFactor: 2,
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
