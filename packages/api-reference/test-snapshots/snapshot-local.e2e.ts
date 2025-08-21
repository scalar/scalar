import { test, expect } from '@playwright/test'

test('Snapshot Local', async ({ page }) => {
  await page.goto('/', { waitUntil: 'networkidle' })
  await expect(page).toHaveScreenshot('snapshot.png', { fullPage: true })
})
