import { test } from '@playwright/test'

import { apiReference } from './api-reference-ui-test'
import { playButton } from './play-button-ui-test'

const HOST = process.env.HOST || 'localhost'

test('@scalar/api-reference jsdelivr build', async ({ page, isMobile }) => {
  await page.goto(`http://${HOST}:3173/api-reference-jsdelivr.html`)

  await apiReference(page, isMobile)

  // TODO: fix the dev workflow
  /** Visual Regression Testing
   * use Playwright built in screenshot functionality https://playwright.dev/docs/screenshots
   * Playwright uses pixelmatch to compare screenshots
   * update screenshots with npx playwright test --update-snapshots
   */
  // await expect(page).toHaveScreenshot('cdn-snapshot.png', {
  //   fullPage: true,
  //   maxDiffPixelRatio: 0.02,
  // })

  /** Capture into buffer
   * If we are unsatisfied with the built in visual regression testing
   * this is how we could pass it to a third party pixel diff facility eg. Chromatic
   *   const buffer = await page.screenshot()
   *   console.log(buffer.toString('base64'))
   */
})

// TODO: The package is just broken and needs to be fixed.
test.skip('@scalar/play-button jsdelivr build', async ({ page, isMobile }) => {
  await page.goto(`http://${HOST}:3173/play-button-jsdelivr.html`)

  await playButton(page, isMobile)
})
