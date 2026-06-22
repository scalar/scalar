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

test.describe('defaultOpenFirstTag', () => {
  test('opens the first tag by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Get all planets' })).toBeVisible()
  })

  test('keeps the first tag closed when set to false', async ({ page }) => {
    const example = await serveExample({ defaultOpenFirstTag: false, content })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Get all planets' })).not.toBeVisible()
  })
})
