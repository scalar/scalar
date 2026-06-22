import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

// The search modal's input is the unambiguous signal that search opened
const searchInput = 'Enter search query'

test.describe('searchHotKey', () => {
  test('opens search with CMD/CTRL + k by default', async ({ page }) => {
    const example = await serveExample()

    await page.goto(example)

    await page.keyboard.press('ControlOrMeta+k')

    await expect(page.getByRole('combobox', { name: searchInput })).toBeVisible()
  })

  test('opens search with the configured hot key', async ({ page }) => {
    const example = await serveExample({ searchHotKey: 'l' })

    await page.goto(example)

    // The default key should no longer open search
    await page.keyboard.press('ControlOrMeta+k')
    await expect(page.getByRole('combobox', { name: searchInput })).not.toBeVisible()

    await page.keyboard.press('ControlOrMeta+l')
    await expect(page.getByRole('combobox', { name: searchInput })).toBeVisible()
  })
})
