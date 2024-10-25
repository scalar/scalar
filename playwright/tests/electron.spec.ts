import { _electron as electron, expect, test } from '@playwright/test'

test('launch app', async ({ page, browserName, isMobile }) => {
  if (browserName !== 'chromium' || isMobile) {
    test.skip()
  }

  // Launch Electron app.
  const electronApp = await electron.launch({
    args: ['../packages/api-client-app/out/main/index.js'],
  })

  // Wait for the main window to be created
  await page.waitForTimeout(500)

  const windows = electronApp.windows()
  const window = windows.find((win) => win.url().includes('index.html'))
  if (!window) {
    throw new Error('Window not found')
  }

  // console.log('Window title:', await window.title()) // this app has no titile right now
  // console.log('Window URL:', window.url())
  expect(window.url()).toContain(
    'packages/api-client-app/out/renderer/index.html#/workspace/default/request/default',
  )

  // TODO: Click an element
  // await window.click('button:text("Workspace")')
  // Or click by CSS selector
  // await mainWindow.click('#some-button-id');
  // Or click by XPath
  // await window.click('//button[contains(text(), "Workspace")]')

  // Capture a screenshot.
  // await window.screenshot({ path: 'electron.png' })

  // Exit app.
  await electronApp.close()
})
