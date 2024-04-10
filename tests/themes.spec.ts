import { expect, test } from '@playwright/test'

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

const baseUrl = 'http://localhost:5050/test-api-reference'

const testOpts = { fullPage: true, maxDiffPixelRatio: 0.02 }

layouts.forEach((layout) =>
  themes.forEach((theme) =>
    test(`Renders the ${theme} with the ${layout} layout`, async ({ page }) => {
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
