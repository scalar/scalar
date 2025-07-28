import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('hideDownloadButton', () => {
  test('shows download button by default', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).toBeVisible()
  })

  test('hides download button when set to true', async ({ page }) => {
    await page.goto(createExample({ hideDownloadButton: true }))

    await expect(page.getByText('Download OpenAPI Document json', { exact: true })).not.toBeVisible()
    await expect(page.getByText('Download OpenAPI Document yaml', { exact: true })).not.toBeVisible()
  })
})
