import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('favicon', () => {
  test('adds a favicon link when configured', async ({ page }) => {
    const example = await serveExample({ favicon: '/favicon.svg' })

    await page.goto(example)

    await expect(page.locator('link[rel="icon"]')).toHaveAttribute('href', '/favicon.svg')
  })
})
