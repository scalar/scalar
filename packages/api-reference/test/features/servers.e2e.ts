import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('servers', () => {
  test('overwrites the servers', async ({ page }) => {
    const example = await serveExample({
      servers: [
        {
          url: 'https://example.com',
        },
      ],
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        servers: [
          {
            url: 'https://does-not-show.com',
          },
        ],
        paths: {},
      },
    })

    await page.goto(example)

    await expect(page.getByText('https://example.com', { exact: true })).toBeVisible()
    await expect(page.getByText('https://does-not-show.com', { exact: true })).not.toBeVisible()
  })
})
