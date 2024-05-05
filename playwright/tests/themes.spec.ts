import { expect, test } from '@playwright/test'

const HOST = process.env.HOST || 'localhost'

const layouts = ['modern', 'classic']
const themes = [
  'alternate',
  'default',
  'moon',
  'purple',
  'solarized',
  'bluePlanet',
  'deepSpace',
  'saturn',
  'kepler',
  'mars',
  'none',
]

const baseUrl = `http://${HOST}:5050/test-api-reference`

const testOpts = { fullPage: true, maxDiffPixelRatio: 0.02 }

test.describe('theme tests', () => {
  // Only run this test on Chromium desktop browser
  test.skip(({ browserName }) => browserName !== 'chromium', 'Chromium only!')
  test.skip(({ isMobile }) => isMobile === true, 'Desktop only!')

  layouts.forEach((layout) =>
    themes.forEach((theme) =>
      test(`Renders the ${theme} with the ${layout} layout`, async ({
        page,
      }) => {
        await page.goto(`${baseUrl}/${layout}/${theme}`)
        await expect(page).toHaveScreenshot(
          `${layout}-${theme}-light-snapshot.png`,
          testOpts,
        )
        await page.goto(`${baseUrl}/${layout}/${theme}?darkMode=true`)
        await expect(page).toHaveScreenshot(
          `${layout}-${theme}-dark-snapshot.png`,
          testOpts,
        )
      }),
    ),
  )
})
