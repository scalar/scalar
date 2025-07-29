import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('url', () => {
  test('renders Petstore (Swagger 2.0) document', async ({ page }) => {
    const example = await serveExample({
      url: 'https://petstore.swagger.io/v2/swagger.json',
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Swagger Petstore', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'pet', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'uploads an image', level: 3 })).toBeVisible()
  })
})
