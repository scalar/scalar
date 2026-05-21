import { mkdtempSync, statSync } from 'node:fs'
import { tmpdir } from 'node:os'
import { join } from 'node:path'

import { _electron, expect, test } from '@playwright/test'

import { runRequestScriptsCspScenario } from './helpers/request-scripts-csp-scenario'

/**
 * Helper function to find the frontend build
 */
const findFolder = () => {
  const possiblePaths = ['../../projects/scalar-app', '../projects/scalar-app', './projects/scalar-app']

  for (const path of possiblePaths) {
    try {
      const absolutePath = join(process.cwd(), path)

      if (statSync(absolutePath).isDirectory()) {
        return absolutePath
      }
    } catch {
      // Ignore resolution errors
    }
  }

  throw new Error('Could not find Electron app entry point')
}

const launchElectronApp = async () => {
  const cwd = findFolder()
  const entryPoint = join(cwd, 'dist/main/index.js')
  const userDataDir = mkdtempSync(join(tmpdir(), 'scalar-app-electron-e2e-'))

  statSync(entryPoint)

  return await _electron.launch({
    args: [`--user-data-dir=${userDataDir}`, entryPoint],
    cwd,
  })
}

const waitForMainWindow = async (app: Awaited<ReturnType<typeof launchElectronApp>>) => {
  await expect
    .poll(
      () => {
        const mainWindow = app.windows().find((win) => win.url().includes('index.html'))
        return mainWindow ? mainWindow.url() : ''
      },
      {
        message: 'Main window should contain index.html',
        timeout: 4_000,
      },
    )
    .toMatch(/projects\/scalar-app\/dist\/renderer\/index.html/)

  return app.windows().find((win) => win.url().includes('index.html')) ?? (await app.firstWindow())
}

test.describe('Electron', () => {
  test.setTimeout(120_000)

  // Chromium-only, ignore mobile
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Electron tests require Chromium and cannot run on mobile',
  )

  test.beforeEach(() => {
    // GitHub Actions and the Playwright Docker image are headless Linux: Electron needs X11/Wayland.
    test.skip(
      Boolean(process.env.CI),
      'Electron needs a display server. Run locally: pnpm --filter scalar-app exec playwright test test/electron.e2e.ts',
    )
  })

  test('launch app', async () => {
    const app = await launchElectronApp()

    try {
      await waitForMainWindow(app)
    } finally {
      await app.close()
    }
  })

  test('pre-request and post-response scripts run under the Electron content security policy', async () => {
    const app = await launchElectronApp()

    try {
      const page = await waitForMainWindow(app)
      await runRequestScriptsCspScenario(page)
    } finally {
      await app.close()
    }
  })
})
