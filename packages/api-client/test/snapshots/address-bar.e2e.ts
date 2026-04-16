import { expect, test } from '@playwright/test'

import { serveExample } from '../utils/serve-example'

/**
 * Takes snapshots of the address bar component
 */
test.describe('Address Bar', () => {
  test('default state', async ({ page }) => {
    const url = await serveExample({ layout: 'web' })
    await page.goto(url)

    // Wait for the address bar to load
    const addressBar = page.locator('[class*="address-bar"]').first()
    await expect(addressBar).toBeVisible({ timeout: 10000 })

    // Take a snapshot of the address bar
    await expect(addressBar).toHaveScreenshot('address-bar-default.png')
  })

  test('with URL entered', async ({ page }) => {
    const url = await serveExample({ layout: 'web' })
    await page.goto(url)

    // Wait for the URL input
    const urlInput = page.getByRole('textbox', { name: /url/i }).or(page.locator('input[type="text"]')).first()
    await expect(urlInput).toBeVisible({ timeout: 10000 })

    // Enter a URL
    await urlInput.fill('https://api.example.com/users')
    await page.waitForTimeout(300)

    // Take a snapshot with URL
    const addressBar = page.locator('[class*="address-bar"]').first()
    await expect(addressBar).toHaveScreenshot('address-bar-with-url.png')
  })
})
