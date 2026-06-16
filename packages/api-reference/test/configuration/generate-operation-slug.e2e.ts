import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/planets': {
      get: { summary: 'Get all planets', tags: ['Planets'] },
    },
  },
}

test.describe('generateOperationSlug', () => {
  test('uses the custom operation slug', async ({ page }) => {
    const example = await serveExample({
      generateOperationSlug: (operation: { path: string; method: string }) =>
        `${operation.method.toLowerCase()}${operation.path.replaceAll('/', '-')}`,
      content,
    })

    await page.goto(example)

    await page.getByRole('navigation').getByRole('button', { name: 'Get all planets' }).click()

    // `tag/<tag-slug>/` is prepended automatically, so we assert the custom part
    await expect(page).toHaveURL(/get-planets/)
  })
})
