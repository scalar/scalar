import { _electron, expect, test } from '@playwright/test'
import { readdirSync } from 'node:fs'

import { waitFor } from './utils/waitFor'

test.describe('Electron', () => {
  // Chromium-only, ignore mobile
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Electron tests require Chromium and cannot run on mobile',
  )

  test('launch app', async () => {
    // Launch the Electron app
    // Log debug info about paths
    console.log('Current working directory:', process.cwd())

    const paths = [
      './packages/api-client-app',
      '../packages/api-client-app',
      '../../packages/api-client-app',
    ]

    for (const path of paths) {
      try {
        console.log(`Contents of ${path}:`, readdirSync(path))
      } catch (e) {
        console.log(`Error reading ${path}:`, e.message)
      }
    }

    const resolvedPath =
      process.env.ELECTRON_APP_PATH ||
      '../../packages/api-client-app/out/main/index.js'

    console.log('Trying to resolve path:', resolvedPath)

    try {
      const fullPath = require.resolve(resolvedPath)
      console.log('Resolved path:', fullPath)
    } catch (e) {
      console.log('Error resolving path:', e.message)
    }

    const app = await _electron.launch({
      args: [
        require.resolve(
          process.env.ELECTRON_APP_PATH ||
            '../../packages/api-client-app/out/main/index.js',
        ),
      ],
    })

    // Wait for the main window to be created
    await waitFor(() => {
      const mainWindow = app
        .windows()
        .find((win) => win.url().includes('index.html'))

      if (mainWindow === undefined) {
        return false
      }

      if (!mainWindow) {
        throw new Error('Couldn’t find the main window (index.html).')
      }

      expect(mainWindow.url()).toContain(
        'packages/api-client-app/out/renderer/index.html',
      )

      return true
    })

    await app.close()
  })
})
