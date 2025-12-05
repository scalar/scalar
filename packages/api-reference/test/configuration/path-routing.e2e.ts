import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('pathRouting', () => {
  test('scrolls to given tag id on load', async ({ page }) => {
    const example = await serveExample({
      pathRouting: {
        basePath: '/my-custom-base-path',
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
            },
          },
        },
      },
    })

    // Make the viewport smaller to test scrolling
    await page.setViewportSize({ width: 1024, height: 100 })

    await page.goto(`${example}/my-custom-base-path/tag/user-tag`)

    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeInViewport()
  })

  test('scrolls to given operation id on load', async ({ page }) => {
    const example = await serveExample({
      pathRouting: {
        basePath: '/my-custom-base-path',
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
            },
          },
        },
      },
    })

    // Make the viewport smaller to test scrolling
    await page.setViewportSize({ width: 1024, height: 100 })

    await page.goto(`${example}/my-custom-base-path/tag/user-tag/get/users`)

    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeInViewport()
  })
})
