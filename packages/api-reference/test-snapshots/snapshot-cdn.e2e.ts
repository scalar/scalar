import { test, expect } from '@playwright/test'

test('Snapshot CDN', async ({ page }) => {
  await page.goto('/cdn', { waitUntil: 'networkidle' })
  await expect(page).toHaveScreenshot('snapshot.png', { fullPage: true })
})
