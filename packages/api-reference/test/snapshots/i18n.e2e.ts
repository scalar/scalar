import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const galaxy = sources[0]

test.setTimeout(60_000)

test('Arabic locale', async ({ page }) => {
  const example = await serveExample({
    ...galaxy,
    i18n: {
      locale: 'ar',
    },
  })

  await page.goto(example)
  await expect(page.getByRole('heading', { name: 'Scalar Galaxy' })).toBeVisible()

  await expect(page).toHaveScreenshot('arabic-reference.png')

  await page.getByRole('search').first().click()
  const searchInput = page.getByRole('combobox', { name: 'بحث' })
  await expect(searchInput).toBeVisible()
  await expect(page).toHaveScreenshot('arabic-search.png')

  await searchInput.fill('Get a token')
  await expect(page).toHaveScreenshot('arabic-search-results.png')
})
