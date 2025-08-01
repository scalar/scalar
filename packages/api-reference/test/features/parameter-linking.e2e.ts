import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

// TODO:
// - pathRouting
// - all parameters
// - requestBody

test.describe('parameter linking', () => {
  test.use({
    permissions: ['clipboard-write', 'clipboard-read'],
  })

  test('requestBody parameters have anchor links', async ({ page }) => {
    const example = await serveExample({
      // If it works with pathRouting, it probably works without it too.
      pathRouting: {
        basePath: '/custom-base-path',
      },
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/users': {
            get: {
              summary: 'Get all users',
              tags: ['user-tag'],
              parameters: [
                {
                  name: 'myCustomQueryParameter',
                  in: 'query',
                  required: true,
                },
                {
                  name: 'myCustomHeaderParameter',
                  in: 'header',
                  required: true,
                },
                {
                  name: 'myCustomPathParameter',
                  in: 'path',
                  required: true,
                },
                {
                  name: 'myCustomCookieParameter',
                  in: 'cookie',
                  required: true,
                },
              ],
              requestBody: {
                content: {
                  'application/json': {
                    schema: {
                      type: 'object',
                      properties: {
                        myCustomBodyParameter: { type: 'string' },
                      },
                    },
                  },
                },
              },
            },
          },
        },
      },
    })

    // Set viewport to a small height to test that the button is not in the viewport
    await page.setViewportSize({ width: 1024, height: 200 })

    await page.goto(example)

    // Before
    await expect(page.getByRole('button', { name: 'myCustomQueryParameter', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'myCustomHeaderParameter', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'myCustomPathParameter', exact: true })).toBeVisible()
    await expect(page.getByRole('button', { name: 'myCustomCookieParameter', exact: true })).toBeVisible()

    const button = page.getByRole('button', { name: 'myCustomBodyParameter', exact: true })
    await expect(button).toBeVisible()
    await expect(button).not.toBeInViewport()

    // Click
    await page.getByRole('button', { name: 'myCustomBodyParameter' }).click()

    // After
    await expect(button).toBeInViewport()
    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain('myCustomBodyParameter')

    await page.reload()

    await expect(button).toBeInViewport()
  })
})
