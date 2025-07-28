import { expect, test } from '@playwright/test'
import { createExample } from './utils/create-example'

test.describe('hideTestRequestButton', () => {
  test('shows test request button by default', async ({ page }) => {
    await page.goto(createExample())

    await expect(page.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })).toBeVisible()
  })

  test('hides test request button when set to true', async ({ page }) => {
    await page.goto(createExample({ hideTestRequestButton: true }))

    await expect(page.getByRole('button', { name: 'Test Request (post /user/signup)', exact: true })).not.toBeVisible()
  })
})
