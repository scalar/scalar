import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('showSidebar', () => {
  test('shows sidebar by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('navigation')).toBeVisible()
  })

  test('hides sidebar when set to false', async ({ page }) => {
    const example = await serveExample({ showSidebar: false })

    await page.goto(example)

    await expect(page.getByRole('navigation')).not.toBeVisible()
  })
})
