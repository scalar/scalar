import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const galaxy = sources[0]

test(galaxy.title, async ({ page }) => {
  const example = await serveExample(galaxy)
  await page.goto(example)

  await page.getByRole('complementary', { name: 'Sidebar' }).getByRole('button', { name: 'Ask AI' }).click()
  await expect(page).toHaveScreenshot('panel.png')
})
