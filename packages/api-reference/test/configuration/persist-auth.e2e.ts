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

    // Wait for the debounce to happen
    await page.waitForTimeout(5000)

    await page.reload()

    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('test')
  })

  test('persists auth across multiple documents', async ({ page }) => {
    const firstDocument = await serveExample({
      persistAuth: true,
      content: {
        openapi: '3.1.1',
        info: {
          title: 'First API',
          version: '1.0.0',
        },
        paths: {},
        security: [
          {
            apiKeyFirst: [],
          },
        ],
        components: {
          securitySchemes: {
            apiKeyFirst: {
              type: 'apiKey',
              name: 'X-First-API-Key',
              in: 'header',
            },
          },
        },
      },
    })

    const secondDocument = await serveExample({
      persistAuth: true,
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Second API',
          version: '1.0.0',
        },
        paths: {},
        security: [
          {
            apiKeySecond: [],
          },
        ],
        components: {
          securitySchemes: {
            apiKeySecond: {
              type: 'apiKey',
              name: 'X-Second-API-Key',
              in: 'header',
            },
          },
        },
      },
    })

    // Load first document and fill in auth
    await page.goto(firstDocument)
    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Value' }).fill('first-api-key')

    // Wait for the debounce to happen
    await page.waitForTimeout(5000)

    // Switch to second document and fill in auth
    await page.goto(secondDocument)
    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()
    await page.getByRole('textbox', { name: 'Value' }).fill('second-api-key')

    // Wait for the debounce to happen
    await page.waitForTimeout(5000)

    // Switch back to first document and verify auth persisted
    await page.goto(firstDocument)
    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('first-api-key')

    // Reload first document and verify auth still persisted
    await page.reload()
    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('first-api-key')

    // Switch to second document and verify auth still persisted there
    await page.goto(secondDocument)
    await expect(page.getByRole('textbox', { name: 'Value' })).toBeVisible()
    await expect(page.getByRole('textbox', { name: 'Value' })).toHaveValue('second-api-key')
  })
})
