import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('customCss', () => {
  test('applies the custom CSS', async ({ page }) => {
    const example = await serveExample({
      customCss: `
        .scalar-api-reference {
          background-color: red !important;
        }
      `,
    })

    await page.goto(example)

    await expect(page.locator('.scalar-api-reference')).toHaveCSS('background-color', 'rgb(255, 0, 0)')
  })
})
