import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('theme', () => {
  test('renders the moon theme', async ({ page }) => {
    const example = await serveExample({
      theme: 'moon',
    })

    await page.goto(example)

    await expect(page.locator('.scalar-api-reference')).toHaveCSS('background-color', 'rgb(204, 201, 179)')
  })
})
