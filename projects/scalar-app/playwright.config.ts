import { type PlaywrightTestConfig, defineConfig } from '@playwright/test'
import { getDockerServer } from '@scalar/helpers/playwright/docker'

const CI = Boolean(process.env.CI)
/** Non-CI Linux: browser runs on host (native or Docker with host networking). */
const isLinux = process.platform === 'linux' && !CI

const APP_PORT = 5077

/**
 * Vite dev server for the web entrypoint (`vite.config.ts` → `root: entrypoints/web`). Listens on
 * all interfaces so Docker (e.g. macOS `host.docker.internal`) can reach it when using
 * {@link getDockerServer}.
 */
/**
 * Force non-Mac hotkey glyphs in the browser so {@link ScalarHotkey} matches Linux CI when developers
 * run E2E on macOS (same OpenAPI client bundle as production; only symbol set is pinned).
 */
const viteWebPlayground = {
  command: `VITE_SCALAR_HOTKEY_SYMBOL_SET=non-mac pnpm exec vite --config vite.config.ts --host 0.0.0.0 --port ${APP_PORT} --strictPort`,
  url: `http://127.0.0.1:${APP_PORT}`,
  reuseExistingServer: !CI,
  timeout: 120_000,
} as const

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

/**
 * E2E tests for surfaces that need a real browser (Monaco workers, monaco-yaml, etc.).
 * Locally, browsers run in `scalarapi/playwright-runner` (same as `@scalar/api-reference`);
 * use `pnpm test:e2e` so `PW_TEST_CONNECT_WS_ENDPOINT` points at that container.
 * Unit tests keep mocking Monaco; see `test/vitest.setup.ts`.
 */
export default defineConfig({
  testDir: './test',
  testMatch: '**/*.e2e.ts',
  workers: '100%',
  fullyParallel: true,
  forbidOnly: CI,
  retries: CI ? 1 : 0,
  reporter,
  /** Basename-only `{testFilePath}` omits `test/`; keep artifacts under `test/`. */
  snapshotPathTemplate: 'test/{testFileName}-snapshots/{arg}{ext}',
  expect: {
    toHaveScreenshot: {
      scale: 'device',
      maxDiffPixelRatio: 0.001,
    },
    timeout: 30_000,
  },
  /**
   * Outside CI: Playwright test runner connects to browsers in Docker (`getDockerServer`).
   * In CI: tests run inside the `playwright-runner` job container; only start Vite here.
   */
  webServer: CI ? [viteWebPlayground] : [getDockerServer(), viteWebPlayground],
  use: {
    baseURL: CI || isLinux ? `http://localhost:${APP_PORT}/` : `http://host.docker.internal:${APP_PORT}/`,
    deviceScaleFactor: 2,
    trace: 'on-first-retry',
    screenshot: { mode: 'only-on-failure' },
  },
})
