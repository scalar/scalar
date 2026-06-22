import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/users': {
      get: {
        summary: 'Get all users',
        operationId: 'getAllUsers',
        tags: ['Users'],
      },
    },
  },
}

test.describe('showOperationId', () => {
  test('does not render the operationId by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await expect(page.getByText('getAllUsers')).toHaveCount(0)
  })

  test('renders the operationId when enabled', async ({ page }) => {
    const example = await serveExample({ showOperationId: true, content })

    await page.goto(example)

    await expect(page.getByText('getAllUsers').first()).toBeVisible()
  })
})
