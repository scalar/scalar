import {
  type Locator,
  type PageAssertionsToHaveScreenshotOptions as ScreenshotOptions,
  expect,
  test,
} from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

/** Tag groups source */
const source = sources[2]

/** Options for the page screenshots */
const getScreenshotOptions = (...mask: Locator[]) =>
  ({
    mask,
    maskColor: '#eee',
  }) satisfies ScreenshotOptions

/**
 * Visual regression for x-tagGroups rendered as classic layout sections (not flattened like modern).
 */
test('sidebar', async ({ page }) => {
  const example = await serveExample({ ...source })
  await page.goto(example)

  const opts = getScreenshotOptions(page.getByRole('main'))

  await expect(page).toHaveScreenshot('tag-group-sidebar.png', opts)
})
test('classic', async ({ page }) => {
  const example = await serveExample({ ...source, layout: 'classic' })
  await page.goto(`${example}#tag/planets`)

  const opts = getScreenshotOptions()

  // Scroll to the bottom of the page
  await page.evaluate(() => {
    document.documentElement.scrollTop = 100000
  })
  await expect(page).toHaveScreenshot('tag-group-classic.png', opts)
})
