import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {
    '/planets': {
      get: { summary: 'Get all planets', tags: ['Planets'] },
    },
    '/moons': {
      get: { summary: 'Get all moons', tags: ['Moons'] },
    },
  },
}

test.describe('defaultOpenAllTags', () => {
  test('opens only the first tag by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Get all planets' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all moons' })).not.toBeVisible()
  })

  test('opens all tags when set to true', async ({ page }) => {
    const example = await serveExample({ defaultOpenAllTags: true, content })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Get all planets' })).toBeVisible()
    await expect(page.getByRole('heading', { name: 'Get all moons' })).toBeVisible()
  })
})
