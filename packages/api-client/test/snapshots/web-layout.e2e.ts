import { expect, test } from '@playwright/test'

import { serveExample } from '../utils/serve-example'

/**
 * Takes snapshots of the web layout
 */
test.describe('Web Layout', () => {
  test('initial state', async ({ page }) => {
    const url = await serveExample({ layout: 'web' })
    await page.goto(url)

    // Wait for the client to load
    const client = page.locator('#scalar-client')
    await expect(client).toBeVisible({ timeout: 15000 })

    // Wait for page to fully load
    await page.waitForTimeout(2000)

    // Take a snapshot of the initial state
    await expect(page).toHaveScreenshot('web-layout-initial.png')
  })
})
