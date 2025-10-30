import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('baseServerURL', () => {
  test('use the window.location.origin to prefix the server URL by default', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        servers: [
          {
            url: '/v1',
          },
        ],
        paths: {},
      },
    })

    await page.goto(example)

    await expect(page.getByText(`${example}/v1`, { exact: true })).toBeVisible()
  })

  test('uses the base server URL to prefix the server URL', async ({ page }) => {
    const example = await serveExample({
      baseServerURL: 'http://example.com',
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        servers: [
          {
            url: '/v1',
          },
        ],
        paths: {},
      },
    })

    await page.goto(example)

    await expect(page.getByText('http://example.com/v1', { exact: true })).toBeVisible()
  })
})
