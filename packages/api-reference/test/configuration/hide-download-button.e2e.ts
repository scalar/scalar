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

test.describe('hideDownloadButton', () => {
  test('shows download button by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(getDownloadButton(page, 'json')).toHaveCount(1)
    await expect(getDownloadButton(page, 'yaml')).toHaveCount(1)
  })

  test('hides download button when set to true', async ({ page }) => {
    const example = await serveExample({ hideDownloadButton: true })

    await page.goto(example)

    await expect(getDownloadButton(page, 'json')).toHaveCount(0)
    await expect(getDownloadButton(page, 'yaml')).toHaveCount(0)
  })
})
