import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Planet: {
        type: 'object',
        properties: { name: { type: 'string' } },
      },
    },
  },
}

test.describe('generateModelSlug', () => {
  test('uses the custom model slug', async ({ page }) => {
    const example = await serveExample({
      generateModelSlug: (model: { name?: string }) => `custom-${model.name?.toLowerCase()}`,
      content,
    })

    await page.goto(example)

    // The Models group is collapsed by default, so expand it before clicking the model
    await page.getByRole('navigation').getByRole('button', { name: 'Models' }).click()
    await page.getByRole('navigation').getByRole('button', { name: 'Planet' }).click()

    // `model/` is prepended automatically
    await expect(page).toHaveURL(/custom-planet/)
  })
})
