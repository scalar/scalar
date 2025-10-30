import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideTestRequestButton', () => {
  test('shows test request button by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })).toBeVisible()
  })

  test('hides test request button when set to true', async ({ page }) => {
    const example = await serveExample({ hideTestRequestButton: true })

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })).not.toBeVisible()
  })
})
