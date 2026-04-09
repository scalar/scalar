import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideClientButton', () => {
  test('hides client button when set to true', async ({ page }) => {
    const example = await serveExample({ hideClientButton: true })

    await page.goto(example)

    await expect(page.getByRole('link', { name: 'Open API Client' })).not.toBeVisible()
  })
})
