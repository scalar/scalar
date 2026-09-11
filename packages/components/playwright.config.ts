import { defineConfig } from '@playwright/test'
import { type WebServer, getDockerServer } from '@scalar/helpers/playwright/docker'

const CI = !!process.env.CI

const isLinux = process.platform === 'linux' && !CI

/**
 * Playwright Test Server
 *
 * This runs the playwright test browser(s) in a docker container to make sure
 * the tests are run in a consistent environment locally and in CI.
 */
const playwrightServer: WebServer = getDockerServer()

/**
 * Gallery
 *
 * The story host for Playwright's `mount()` fixture. `pnpm preview:gallery` builds it and then
 * serves it, so the server always serves what is on disk and there is no separate build step to
 * forget.
 *
 * The build is worth its two seconds: every `mount()` navigates, and serving the gallery from a Vite
 * dev server instead made the suite take 212s rather than 36s, because each of those navigations
 * re-requests the app source module by module.
 *
 * Storybook used to fill this role. It is still the workbench you browse with `pnpm dev`, but it is
 * no longer a test dependency, so the suite does not wait on a Storybook build to run.
 */
const galleryServer: WebServer = {
  name: 'Gallery',
  command: 'pnpm preview:gallery',
  url: 'http://localhost:5101',
  reuseExistingServer: !CI,
} as const

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
   * In CI we only need the gallery because the CI container is the playwright server
   *
   * @see https://playwright.dev/docs/ci#via-containers
   */
  webServer: CI ? [galleryServer] : [playwrightServer, galleryServer],
  workers: '100%',
  use: {
    /** `mount()` navigates here and calls the gallery's `window.mount()` */
    baseURL: CI || isLinux ? 'http://localhost:5101/' : 'http://host.docker.internal:5101/',
    /** Use a smaller viewport for components */
    viewport: { width: 640, height: 480 },
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
