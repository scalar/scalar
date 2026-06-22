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
          satellite: {
            type: 'object',
            properties: {
              craterCount: { type: 'number' },
            },
          },
        },
      },
    },
  },
}

test.describe('expandAllSchemaProperties', () => {
  test('keeps nested child properties collapsed by default', async ({ page }) => {
    const example = await serveExample({ expandAllModelSections: true, content })

    await page.goto(`${example}#models`)

    await expect(page.getByText('craterCount')).not.toBeVisible()
  })

  test('expands nested child properties when enabled', async ({ page }) => {
    const example = await serveExample({
      expandAllModelSections: true,
      expandAllSchemaProperties: true,
      content,
    })

    await page.goto(`${example}#models`)

    await expect(page.getByText('craterCount').first()).toBeVisible()
  })
})
