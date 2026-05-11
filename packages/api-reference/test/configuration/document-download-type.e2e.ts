import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/**
 * Locate a download button by the format shown on its (hover-revealed) badge.
 *
 * The visible label is "Download OpenAPI Document" on both buttons, so we
 * filter by the inner `.extension` badge to distinguish json from yaml.
 */
const getDownloadButton = (page: Page, format: 'json' | 'yaml') =>
  page
    .getByRole('button', { name: 'Download OpenAPI Document' })
    .filter({ has: page.locator('.extension', { hasText: format }) })

test.describe('documentDownloadType', () => {
  test('shows both download buttons by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(getDownloadButton(page, 'json')).toHaveCount(1)
    await expect(getDownloadButton(page, 'yaml')).toHaveCount(1)
  })

  test('hides yaml download button when set to json', async ({ page }) => {
    const example = await serveExample({ documentDownloadType: 'json' })

    await page.goto(example)

    await expect(getDownloadButton(page, 'json')).toHaveCount(1)
    await expect(getDownloadButton(page, 'yaml')).toHaveCount(0)
  })

  test('hides json download button when set to yaml', async ({ page }) => {
    const example = await serveExample({ documentDownloadType: 'yaml' })

    await page.goto(example)

    await expect(getDownloadButton(page, 'json')).toHaveCount(0)
    await expect(getDownloadButton(page, 'yaml')).toHaveCount(1)
  })
})
