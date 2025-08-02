import { expect, test } from '@playwright/test'

test.describe('ScalarCard', () => {
  test('base', async ({ page }) => {
    await page.goto('/iframe.html?args=&id=components-scalarcard--default&viewMode=story')
    await expect(page.locator('body')).toHaveScreenshot()
  })
})
