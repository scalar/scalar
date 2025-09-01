import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('layout', () => {
  test('renders modern layout by default', async ({ page }) => {
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

    await expect(page.getByRole('region', { name: 'user-tag', exact: true })).toBeVisible()
    await expect(page.getByRole('region', { name: 'user-tag', exact: true })).toHaveAttribute('layout', 'modern')
  })

  test('renders classic layout when set to classic', async ({ page }) => {
    const example = await serveExample({
      layout: 'classic',
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

    // We need another selector here, because the layout is just different.
    // TODO: Ideally, we'd have the same 'region' selector for both layouts.
    await expect(page.locator('.section-accordion-wrapper')).toBeVisible()
    await expect(page.locator('.section-accordion-wrapper')).toHaveAttribute('layout', 'classic')
  })
})
