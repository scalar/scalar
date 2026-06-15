import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('customFetch', () => {
  test('loads the OpenAPI document through the custom fetch function', async ({ page }) => {
    const example = await serveExample({
      url: 'https://example.com/does-not-exist.json',
      // The custom fetch short-circuits the document request and returns our own
      // document, proving Scalar uses it instead of the global fetch.
      customFetch: () =>
        Promise.resolve(
          new Response(
            JSON.stringify({
              openapi: '3.1.1',
              info: { title: 'Custom Fetched API', version: '1.0.0' },
              paths: {},
            }),
            { headers: { 'Content-Type': 'application/json' } },
          ),
        ),
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Custom Fetched API', level: 1 })).toBeVisible()
  })
})
