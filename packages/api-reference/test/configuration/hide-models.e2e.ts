import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideModels', () => {
  test('shows models by default', async ({ page }) => {
    const example = await serveExample()

    // Content is virtualized: navigate to the models section by id so it is rendered
    await page.goto(`${example}#models`)

    await expect(page.getByRole('heading', { name: 'Models', level: 2 })).toBeVisible()
  })

  test('hides models when set to true', async ({ page }) => {
    const example = await serveExample({ hideModels: true })

    await page.goto(example)

    await expect(page.getByRole('heading', { name: 'Models', level: 2 })).not.toBeVisible()
  })
})
