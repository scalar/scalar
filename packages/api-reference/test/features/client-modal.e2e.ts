import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('client modal', () => {
  test('opens the client modal when clicked', async ({ page }) => {
    const example = await serveExample({
      content: {
        openapi: '3.1.1',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        paths: {
          '/endpoint': {
            get: {
              summary: 'Get endpoint',
            },
          },
        },
      },
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Test Request' }).first().click()

    await expect(page.getByRole('dialog')).toBeVisible()

    await expect(page.getByRole('dialog').getByRole('button', { name: 'Show Sidebar' })).toBeFocused()
  })
})
