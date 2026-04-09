import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const galaxy = sources[0]

test(galaxy.title, async ({ page }) => {
  const example = await serveExample(galaxy)
  await page.goto(example)

  await page.getByRole('navigation', { name: 'Sidebar' }).getByRole('search').click()
  await expect(page).toHaveScreenshot('search.png')

  await page.getByRole('combobox', { name: 'Enter search query' }).fill('Get a token')
  await expect(page).toHaveScreenshot('search-filled.png')
})
