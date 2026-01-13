import { statSync } from 'node:fs'
import { join } from 'node:path'

import { _electron, expect, test } from '@playwright/test'

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

test.describe('Electron', () => {
  // Chromium-only, ignore mobile
  test.skip(
    ({ browserName, isMobile }) => browserName !== 'chromium' || isMobile,
    'Electron tests require Chromium and cannot run on mobile',
  )

  test('launch app', async () => {
    // Check whether the build was found
    const cwd = findFolder()

    console.log()
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

    // Wait for the main window to load `index.html`
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
      .toMatch(/projects\/scalar-app\/dist\/renderer\/index.html$/)

    await app.close()
  })
})
