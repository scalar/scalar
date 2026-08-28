import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'
import { type WebServer, getDockerServer } from '@scalar/helpers/playwright/docker'

const CI = Boolean(process.env.CI)
const isLinux = process.platform === 'linux' && !CI

/**
 * Storybook, built to `storybook-static` and served by `vite preview`.
 *
 * In CI the container is already the Playwright browser server, so we only need Storybook. Locally
 * we also start the dockerized browser server for consistent, cross-platform screenshots.
 */
const storybookServer: WebServer = {
  name: 'Storybook',
  command: 'pnpm preview:storybook',
  url: 'http://localhost:6006',
  reuseExistingServer: !CI,
  timeout: 120 * 1000,
}

const reporter: PlaywrightTestConfig['reporter'] = [['list']]

if (CI) {
  reporter.push(
    ['html', { open: 'never', outputFolder: 'playwright-report-storybook' }],
    ['json', { outputFile: 'playwright-results-storybook.json' }],
  )
} else {
  reporter.push(['html', { open: 'on-failure' }])
}

// https://playwright.dev/docs/test-configuration
export default defineConfig({
  // Snapshot tests live next to the components they cover, so they never collide with the
  // document-level e2e suite in `test/**` (which uses its own playwright.config.ts).
  testMatch: 'src/**/*.snapshot.e2e.ts',
  workers: '100%',
  fullyParallel: true,
  reporter,
  webServer: CI ? [storybookServer] : [getDockerServer(), storybookServer],
  snapshotPathTemplate: '{testFileDir}/snapshots/{arg}{ext}',
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
    /** Storybook is served on the docker host, reachable from the browser container. */
    baseURL: CI || isLinux ? 'http://localhost:6006/' : 'http://host.docker.internal:6006/',
    /** Use a smaller viewport for isolated components */
    viewport: { width: 800, height: 600 },
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
