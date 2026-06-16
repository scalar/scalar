import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  security: [{ apiKey: [] }],
  components: {
    securitySchemes: {
      apiKey: {
        type: 'apiKey',
        name: 'X-API-Key',
        in: 'header',
      },
    },
  },
}

test.describe('authentication', () => {
  test('prefills the configured api key value', async ({ page }) => {
    const example = await serveExample({
      authentication: {
        securitySchemes: {
          apiKey: {
            value: 'prefilled-token',
          },
        },
      },
      content,
    })

    await page.goto(example)

    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('prefilled-token')
  })
})
