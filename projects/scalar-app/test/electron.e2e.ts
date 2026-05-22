import { mkdtempSync, statSync } from 'node:fs'
import { createRequire } from 'node:module'
import { tmpdir } from 'node:os'
import { isAbsolute, join } from 'node:path'

import type { ElectronApplication } from '@playwright/test'
import { _electron, expect, test } from '@playwright/test'

import { runSandboxPostMessageSmokeScenario } from './helpers/request-scripts-csp-scenario'

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

type LaunchElectronAppResult = {
  app: ElectronApplication
  userDataDir: string
}

const findElectronExecutable = (cwd: string): string => {
  const require = createRequire(join(cwd, 'package.json'))
  const electronPath = require.resolve('electron')
  const executable = require(electronPath)

  if (typeof executable !== 'string') {
    throw new TypeError('Expected Electron to resolve to an executable path')
  }

  const electronExecutable = isAbsolute(executable) ? executable : join(electronPath, '..', executable)

  statSync(electronExecutable)

  return electronExecutable
}

const launchElectronApp = async (): Promise<LaunchElectronAppResult> => {
  const cwd = findFolder()
  const electronExecutable = findElectronExecutable(cwd)
  const userDataDir = mkdtempSync(join(tmpdir(), 'scalar-app-electron-e2e-'))

  statSync(join(cwd, 'dist/main/index.js'))
  statSync(join(cwd, 'dist/preload/index.mjs'))
  statSync(join(cwd, 'dist/renderer/index.html'))

  const app = await _electron.launch({
    args: [`--user-data-dir=${userDataDir}`, cwd],
    cwd,
    env: {
      ...process.env,
      SCALAR_ELECTRON_E2E: 'production',
    },
    executablePath: electronExecutable,
  })

  return {
    app,
    userDataDir,
  }
}

const waitForMainWindow = async (app: ElectronApplication) => {
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
      'Electron needs a display server. Run locally: pnpm --filter scalar-app test:e2e:app',
    )
  })

  test('launch app', async () => {
    const { app, userDataDir } = await launchElectronApp()

    try {
      expect(userDataDir).toContain('scalar-app-electron-e2e-')
      await waitForMainWindow(app)
    } finally {
      await app.close()
    }
  })

  test('pre-request and post-response scripts run under the Electron content security policy', async () => {
    const { app } = await launchElectronApp()

    try {
      const page = await waitForMainWindow(app)
      await runSandboxPostMessageSmokeScenario(page)
    } finally {
      await app.close()
    }
  })
})
