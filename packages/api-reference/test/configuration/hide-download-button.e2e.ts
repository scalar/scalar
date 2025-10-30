import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideDownloadButton', () => {
  test('shows download button by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).toBeVisible()
  })

  test('hides download button when set to true', async ({ page }) => {
    const example = await serveExample({ hideDownloadButton: true })

    await page.goto(example)

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).not.toBeVisible()
  })
})
