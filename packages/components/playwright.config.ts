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

/** The gallery page `mount()` navigates to. Vite serves it from source, so there is no build. */
const GALLERY_PATH = 'test/gallery/index.html'

/**
 * Gallery
 *
 * The story host for Playwright's `mount()` fixture, served straight from source by Vite.
 *
 * Storybook used to fill this role. It is still the workbench you browse with `pnpm dev`, but it is
 * no longer a test dependency, so the suite does not wait on a Storybook build to run.
 */
const galleryServer: WebServer = {
  name: 'Gallery',
  command: 'pnpm dev:gallery',
  url: `http://localhost:5101/${GALLERY_PATH}`,
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
    baseURL: `http://${CI || isLinux ? 'localhost' : 'host.docker.internal'}:5101/${GALLERY_PATH}`,
    /** Use a smaller viewport for components */
    viewport: { width: 640, height: 480 },
    /** Save a screenshot on failure */
    screenshot: { mode: 'only-on-failure' },
  },
})
