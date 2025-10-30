import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('persistAuth', () => {
  test('does not persist auth by default', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        security: [
          {
            apiKey: [],
          },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'apiKey',
              in: 'header',
            },
          },
        },
      },
    })

    await page.goto(example)

    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()

    await page.getByRole('textbox', { name: 'Value' }).fill('test')

    await page.reload()

    await expect(page.getByRole('textbox', { name: 'Value' })).not.toHaveValue('test')
  })

  test('persists auth when set to true', async ({ page }) => {
    const example = await serveExample({
      persistAuth: true,
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {},
        security: [
          {
            apiKey: [],
          },
        ],
        components: {
          securitySchemes: {
            apiKey: {
              type: 'apiKey',
              name: 'apiKey',
              in: 'header',
            },
          },
        },
      },
    })

    await page.goto(example)

    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()

    await page.getByRole('textbox', { name: 'Value' }).fill('test')

    await page.reload()

    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('test')
  })
})
