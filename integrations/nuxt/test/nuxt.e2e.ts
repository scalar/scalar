import { expect, test } from '@playwright/test'

test('Renders scalar/galaxy api reference from nuxt', async ({ page }) => {
  await page.goto('/_scalar')

  await expect(page.getByRole('heading', { name: 'Nitro Server Routes' })).toBeVisible()
})
