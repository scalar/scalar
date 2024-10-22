import { _electron as electron, test } from '@playwright/test'

test('launch app', async ({ browserName, isMobile }) => {
  if (browserName !== 'chromium' || isMobile) {
    test.skip()
  }
  // Launch Electron app.
  const electronApp = await electron.launch({
    args: ['../packages/api-client-app/out/main/index.js'],
  })

  // Evaluation expression in the Electron context.
  const appPath = await electronApp.evaluate(async ({ app }) => {
    // This runs in the main Electron process, parameter here is always
    // the result of the require('electron') in the main app script.
    return app.getAppPath()
  })
  console.log(appPath)

  // Get the first window that the app opens, wait if necessary.
  const window = await electronApp.firstWindow()
  // Print the title.
  console.log(await window.title())
  // Direct Electron console to Node terminal.
  window.on('console', console.log)
  // Capture a screenshot.
  await window.screenshot({ path: 'homepage.png' })
  // Click button.
  await window.click('text=Workspace')
  // Exit app.
  await electronApp.close()
})
