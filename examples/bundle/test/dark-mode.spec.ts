import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('darkMode', () => {
  test('uses system preference by default (light mode)', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.locator('body')).not.toHaveClass('dark-mode')
  })

  test('uses dark mode when set to true', async ({ page }) => {
    await page.goto(createExample({ darkMode: true }))

    await expect(page.locator('body')).toHaveClass('dark-mode')
  })

  test('uses light mode when set to false', async ({ page }) => {
    await page.goto(createExample({ darkMode: false }))

    await expect(page.locator('body')).toHaveClass('light-mode')
  })
})
