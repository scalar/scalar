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

test.describe('generateTagSlug', () => {
  test('uses the slug from the document by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(example)

    // Operation hashes are prefixed with `tag/<tag-slug>/`, so clicking one reveals the tag slug
    await page.getByRole('navigation').getByRole('button', { name: 'Get all planets' }).click()

    await expect(page).toHaveURL(/tag\/planets/)
  })

  test('uses the custom tag slug', async ({ page }) => {
    const example = await serveExample({
      generateTagSlug: (tag: { name?: string }) => `v1-${tag.name?.toLowerCase()}`,
      content,
    })

    await page.goto(example)

    await page.getByRole('navigation').getByRole('button', { name: 'Get all planets' }).click()

    await expect(page).toHaveURL(/tag\/v1-planets/)
  })
})
