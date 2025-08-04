import { statSync } from 'node:fs'
import { join } from 'node:path'
import { _electron, expect, test } from '@playwright/test'

import { waitFor } from './utils/wait-for'

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

    // Wait for the main window to be created
    await waitFor(
      () => {
        const mainWindow = app.windows().find((win) => win.url().includes('index.html'))

        if (!mainWindow) {
          return false
        }

        expect(mainWindow.url()).toContain('projects/scalar-app/dist/renderer/index.html')

        return true
      },
      () => {
        console.log()
        console.log('=== App Windows ===')
        console.log()
        console.log(
          app
            .windows()
            .map((w) => w.url())
            .join('\n\n'),
        )
      },
    )

    await app.close()
  })
})
