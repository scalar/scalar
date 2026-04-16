import { expect, test } from '@playwright/test'

import { serveExample } from '../utils/serve-example'

/**
 * Takes snapshots of the desktop layout (app)
 */
test.describe('Desktop Layout', () => {
  test('sidebar and workspace', async ({ page }) => {
    const url = await serveExample({ layout: 'desktop' })
    await page.goto(url)

    // Wait for the client to load
    const client = page.locator('#scalar-client')
    await expect(client).toBeVisible()

    // Wait for the sidebar to be visible
    const sidebar = page.locator('aside').first()
    await expect(sidebar).toBeVisible({ timeout: 10000 })

    // Take a snapshot of the initial state
    await expect(page).toHaveScreenshot('desktop-layout-initial.png')

    // Try to expand collection items if present
    const expandButtons = page.getByRole('button', { name: /expand/i })
    const count = await expandButtons.count()

    if (count > 0) {
      // Expand the first few items
      for (let i = 0; i < Math.min(count, 3); i++) {
        try {
          await expandButtons.nth(i).click({ timeout: 1000 })
          await page.waitForTimeout(200)
        } catch {
          // Continue if button is not clickable
        }
      }

      await expect(page).toHaveScreenshot('desktop-layout-expanded.png')
    }
  })

  test('request and response areas', async ({ page }) => {
    const url = await serveExample({ layout: 'desktop' })
    await page.goto(url)

    // Wait for the client to load
    await expect(page.locator('#scalar-client')).toBeVisible()

    // Wait for main content area
    const mainContent = page.locator('main').first()
    await expect(mainContent).toBeVisible({ timeout: 10000 })

    // Take a snapshot of the request/response area
    await expect(mainContent).toHaveScreenshot('desktop-request-response-area.png')
  })
})
