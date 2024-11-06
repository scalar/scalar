import { _electron, expect, test } from '@playwright/test'
import { statSync } from 'node:fs'
import { join } from 'node:path'

import { waitFor } from './utils/waitFor'

// Helper function to find the frontend build
const findFolder = () => {
  const possiblePaths = ['../packages/api-client-app']

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

test.describe('Electron', () => {
  // Chromium-only, ignore mobile
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Electron tests require Chromium and cannot run on mobile',
  )

  test('launch app', async () => {
    // Check whether the build was found
    const cwd = findFolder()

    console.log('=== DEBUG ===')
    console.log()
    console.log('CWD:        ', process.cwd())
    console.log('App folder: ', cwd)
    console.log('Entry point:', join(cwd, 'dist/main/index.js'))
    console.log()

    // Verify the entry point file exists
    try {
      const entryPoint = join(cwd, 'dist/main/index.js')
      statSync(entryPoint)
      console.log('✅ Entry point exists.')
    } catch (error) {
      console.error('❌ Entry point not found:', error)
    }

    // Launch the Electron app with absolute path
    const app = await _electron.launch({
      args: [join(cwd, 'dist/main/index.js')],
      cwd,
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
        'packages/api-client-app/dist/renderer/index.html',
      )

      return true
    })

    await app.close()
  })
})
