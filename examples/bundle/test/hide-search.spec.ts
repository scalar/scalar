import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('hideSearch', () => {
  test('shows search by default', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.getByRole('search')).toBeVisible()
  })

  test('hides search when set to true', async ({ page }) => {
    await page.goto(createExample({ hideSearch: true }))

    await expect(page.getByRole('search')).not.toBeVisible()
  })
})
