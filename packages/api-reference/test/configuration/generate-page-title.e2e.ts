import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('generatePageTitle', () => {
  test('set correct page title', async ({ page }) => {
    const example = await serveExample({
      generatePageTitle: (item) => `API Reference - ${item.title}`,
    })

    await page.goto(example)

    await page.getByRole('button', { name: 'Create a user' }).click()

    await expect(page).toHaveTitle('API Reference - Create a user')
  })
})
