import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

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
    await page.setViewportSize({ width: 1024, height: 400 })
    await page.goto(example)

    // Before
    await page.hover('text=myCustomBodyParameter')

    const button = page.getByRole('button', { name: 'Copy link to myCustomBodyParameter', exact: true })
    await expect(button).toBeVisible()

    // Click
    await page.getByRole('button', { name: 'myCustomBodyParameter' }).click()
    await expect(button).toBeInViewport()

    // Should show a success message
    await expect(page.getByRole('status').filter({ hasText: 'Copied' })).toBeVisible()

    // Scroll to the top of the page
    await page.evaluate(() => window.scrollTo(0, 0))
    await expect(button).not.toBeInViewport()

    const clipboard = await page.evaluate(() => navigator.clipboard.readText())
    expect(clipboard).toContain('myCustomBodyParameter')

    await page.reload()

    await expect(button).toBeInViewport()
  })
})
