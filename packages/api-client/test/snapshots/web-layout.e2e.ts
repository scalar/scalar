import { expect, test } from '@playwright/test'

import { serveExample } from '../utils/serve-example'

/**
 * Takes snapshots of the web layout
 */
test.describe('Web Layout', () => {
  test('address bar and request editor', async ({ page }) => {
    const url = await serveExample({ layout: 'web' })
    await page.goto(url)

    // Wait for the client to load
    const client = page.locator('#scalar-client')
    await expect(client).toBeVisible()

    // Wait for the address bar to be visible
    const addressBar = page.getByRole('combobox', { name: /method/i }).first()
    await expect(addressBar).toBeVisible({ timeout: 10000 })

    // Take a snapshot of the initial state
    await expect(page).toHaveScreenshot('web-layout-initial.png')

    // Expand the request body section if present
    const bodyTab = page.getByRole('tab', { name: /body/i }).first()
    if (await bodyTab.isVisible()) {
      await bodyTab.click()
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('web-layout-request-body.png')
    }

    // Check headers tab
    const headersTab = page.getByRole('tab', { name: /headers/i }).first()
    if (await headersTab.isVisible()) {
      await headersTab.click()
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('web-layout-headers.png')
    }

    // Check query params tab
    const queryTab = page.getByRole('tab', { name: /query/i }).first()
    if (await queryTab.isVisible()) {
      await queryTab.click()
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('web-layout-query-params.png')
    }

    // Check auth tab
    const authTab = page.getByRole('tab', { name: /auth/i }).first()
    if (await authTab.isVisible()) {
      await authTab.click()
      await page.waitForTimeout(200)
      await expect(page).toHaveScreenshot('web-layout-auth.png')
    }
  })
})
