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
        // `optionalName` comes first in the document, but `requiredName` is required
        properties: {
          optionalName: { type: 'string' },
          requiredName: { type: 'string' },
        },
        required: ['requiredName'],
      },
    },
  },
}

/** Returns the vertical position of the first element rendering the given text. */
const topOf = async (page: Page, text: string) => {
  const box = await page.getByText(text, { exact: true }).first().boundingBox()
  return box?.y ?? Number.POSITIVE_INFINITY
}

test.describe('orderRequiredPropertiesFirst', () => {
  test('renders required properties before optional ones by default', async ({ page }) => {
    const example = await serveExample({ expandAllModelSections: true, content })

    await page.goto(`${example}#models`)

    await expect(page.getByText('requiredName', { exact: true }).first()).toBeVisible()
    expect(await topOf(page, 'requiredName')).toBeLessThan(await topOf(page, 'optionalName'))
  })

  test('preserves document order when disabled', async ({ page }) => {
    const example = await serveExample({
      orderRequiredPropertiesFirst: false,
      orderSchemaPropertiesBy: 'preserve',
      expandAllModelSections: true,
      content,
    })

    await page.goto(`${example}#models`)

    await expect(page.getByText('optionalName', { exact: true }).first()).toBeVisible()
    expect(await topOf(page, 'optionalName')).toBeLessThan(await topOf(page, 'requiredName'))
  })
})
