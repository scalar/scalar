import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideSearch', () => {
  test('shows search by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('search')).toBeVisible()
  })

  test('hides search when set to true', async ({ page }) => {
    const example = await serveExample({ hideSearch: true })

    await page.goto(example)

    await expect(page.getByRole('search')).not.toBeVisible()
  })
})
