import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('hideDarkModeToggle', () => {
  test('shows dark mode toggle by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Set dark mode' })).toBeVisible()
  })

  test('hides dark mode toggle when set to true', async ({ page }) => {
    const example = await serveExample({ hideDarkModeToggle: true })

    await page.goto(example)

    await expect(page.getByRole('button', { name: 'Set dark mode' })).not.toBeVisible()
  })
})
