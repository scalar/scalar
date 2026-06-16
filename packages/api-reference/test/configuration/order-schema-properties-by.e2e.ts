import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

const content = {
  openapi: '3.1.1',
  info: { title: 'Test API', version: '1.0.0' },
  paths: {},
  components: {
    schemas: {
      Planet: {
        type: 'object',
        // Deliberately not alphabetical so the ordering behavior is observable
        properties: {
          zebra: { type: 'string' },
          apple: { type: 'string' },
        },
      },
    },
  },
}

/** Returns the vertical position of the first element rendering the given text. */
const topOf = async (page: Page, text: string) => {
  const box = await page.getByText(text, { exact: true }).first().boundingBox()
  return box?.y ?? Number.POSITIVE_INFINITY
}

test.describe('orderSchemaPropertiesBy', () => {
  test('sorts properties alphabetically by default', async ({ page }) => {
    const example = await serveExample({ expandAllModelSections: true, content })

    await page.goto(`${example}#models`)

    await expect(page.getByText('apple', { exact: true }).first()).toBeVisible()
    expect(await topOf(page, 'apple')).toBeLessThan(await topOf(page, 'zebra'))
  })

  test('preserves the document order when set to preserve', async ({ page }) => {
    const example = await serveExample({
      orderSchemaPropertiesBy: 'preserve',
      expandAllModelSections: true,
      content,
    })

    await page.goto(`${example}#models`)

    await expect(page.getByText('zebra', { exact: true }).first()).toBeVisible()
    expect(await topOf(page, 'zebra')).toBeLessThan(await topOf(page, 'apple'))
  })
})
