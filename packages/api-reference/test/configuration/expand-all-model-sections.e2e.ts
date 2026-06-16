import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Planet: {
        type: 'object',
        properties: {
          diameter: { type: 'number' },
        },
      },
    },
  },
}

test.describe('expandAllModelSections', () => {
  test('keeps model sections collapsed by default', async ({ page }) => {
    const example = await serveExample({ content })

    await page.goto(`${example}#models`)

    await expect(page.getByText('diameter')).not.toBeVisible()
  })

  test('expands all model sections when enabled', async ({ page }) => {
    const example = await serveExample({ expandAllModelSections: true, content })

    await page.goto(`${example}#models`)

    await expect(page.getByText('diameter').first()).toBeVisible()
  })
})
