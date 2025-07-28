import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('content', () => {
  test('renders title for a simple document', async ({ page }) => {
    await page.goto(
      createExample({
        // Required to overwrite the default URL
        url: undefined,
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
      }),
    )

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })
})
