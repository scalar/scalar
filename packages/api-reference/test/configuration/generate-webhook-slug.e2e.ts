import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  webhooks: {
    newPlanet: {
      post: {
        summary: 'New planet',
        requestBody: {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        },
        responses: { '200': { description: 'OK' } },
      },
    },
  },
}

test.describe('generateWebhookSlug', () => {
  test('uses the custom webhook slug', async ({ page }) => {
    const example = await serveExample({
      generateWebhookSlug: (webhook: { name: string; method?: string }) => `v1-${webhook.name}`,
      content,
    })

    await page.goto(example)

    await page.getByRole('navigation').getByRole('button', { name: 'New planet' }).click()

    // `webhook/` is prepended automatically
    await expect(page).toHaveURL(/webhook\/v1-newPlanet/)
  })
})
