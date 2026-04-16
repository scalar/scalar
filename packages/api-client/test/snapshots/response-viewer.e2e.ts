import { expect, test } from '@playwright/test'

import { serveExample } from '../utils/serve-example'

/**
 * Takes snapshots of the response viewer
 */
test.describe('Response Viewer', () => {
  test('empty state', async ({ page }) => {
    const url = await serveExample({ layout: 'web' })
    await page.goto(url)

    // Wait for the client to load
    await expect(page.locator('#scalar-client')).toBeVisible()

    // Look for the response section
    const responseSection = page.locator('[class*="response"]').or(page.getByText(/response/i)).first()
    
    // Wait a bit for the UI to settle
    await page.waitForTimeout(1000)

    // Take a snapshot of the response area (empty state)
    await expect(page).toHaveScreenshot('response-viewer-empty.png')
  })
})
