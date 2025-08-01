import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('content', () => {
  test('renders title for a simple document (js object)', async ({ page }) => {
    const example = await serveExample({
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

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })

  test('renders title for a simple document (JSON)', async ({ page }) => {
    const example = await serveExample({
      content: JSON.stringify({
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
      }),
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })

  test('renders title for a simple document (YAML)', async ({ page }) => {
    const example = await serveExample({
      content: `openapi: '3.1.1'
info:
  title: 'Test API'
  version: '1.0.0'
paths:
  '/users':
    get:
      summary: 'Get all users'
      tags: ['user-tag']
`,
    })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Test API', level: 1 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'user-tag', level: 2 })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all users', level: 3 })).toBeVisible()
  })
})
