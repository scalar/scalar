import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('showToolbar', () => {
  test('shows toolbar when enabled', async ({ page }) => {
    const example = await serveExample({
      showToolbar: 'always',
    })

    await page.goto(example)

    await expect(page.getByLabel('Developer Tools')).toBeVisible()
  })

  test('hides toolbar if set to never', async ({ page }) => {
    const example = await serveExample({
      showToolbar: 'never',
    })

    await page.goto(example)

    await expect(page.getByLabel('Developer Tools')).toBeHidden()
  })
})
