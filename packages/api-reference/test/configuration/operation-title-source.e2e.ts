import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/users/list': {
      get: {
        summary: 'Get all users',
        tags: ['Users'],
      },
    },
  },
}

test.describe('operationTitleSource', () => {
  test('uses the operation summary in the sidebar by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await expect(page.getByRole('navigation').getByRole('button', { name: 'Get all users' })).toBeVisible()
  })

  test('uses the operation path in the sidebar when set to path', async ({ page }) => {
    const example = await serveExample({ operationTitleSource: 'path', content })

    await page.goto(example)

    await expect(page.getByRole('navigation').getByRole('button', { name: '/users/list' })).toBeVisible()
  })
})
