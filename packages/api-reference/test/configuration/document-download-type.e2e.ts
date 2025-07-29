import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('documentDownloadType', () => {
  test('shows both download buttons by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).toBeVisible()
  })

  test('hides yaml download button when set to json', async ({ page }) => {
    const example = await serveExample({ documentDownloadType: 'json' })

    await page.goto(example)

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).not.toBeVisible()
  })

  test('hides json download button when set to yaml', async ({ page }) => {
    const example = await serveExample({ documentDownloadType: 'yaml' })

    await page.goto(example)

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).toBeVisible()
  })
})
