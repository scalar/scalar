import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('forceDarkModeState', () => {
  test('uses system preference by default (light mode)', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await expect(page.locator('body')).toHaveClass('light-mode')
    await expect(page.locator('body')).not.toHaveClass('dark-mode')
  })

  test('uses dark mode when set to true', async ({ page }) => {
    const example = await serveExample({ forceDarkModeState: 'dark' })

    await page.goto(example)

    await expect(page.locator('body')).not.toHaveClass('light-mode')
    await expect(page.locator('body')).toHaveClass('dark-mode')
  })

  test('uses light mode when set to false', async ({ page }) => {
    const example = await serveExample({ forceDarkModeState: 'light' })

    await page.goto(example)

    await expect(page.locator('body')).toHaveClass('light-mode')
    await expect(page.locator('body')).not.toHaveClass('dark-mode')
  })
})
