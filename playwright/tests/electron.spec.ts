import { _electron, expect, test } from '@playwright/test'

import { waitFor } from './utils/waitFor'

test.describe('Electron', () => {
  // Chromium-only, ignore mobile
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Electron tests require Chromium and cannot run on mobile',
  )

  test('launch app', async () => {
    // Launch the Electron app
    const app = await _electron.launch({
      args: ['../packages/api-client-app/out/main/index.js'],
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
