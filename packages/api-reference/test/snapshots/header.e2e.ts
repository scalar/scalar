import {
  type Page,
  type PageAssertionsToHaveScreenshotOptions as ScreenshotOptions,
  type ViewportSize,
  devices,
  expect,
  test,
} from '@playwright/test'
import { isClassic } from '@test/utils/is-classic'
import { serveExample } from '@test/utils/serve-example'

import { type Slug, sources } from '../utils/sources'

/** A shorter list of slugs to test */
const slugs: Slug[] = ['scalar-galaxy', 'scalar-galaxy-classic']
const toTest = sources.filter(({ slug }) => slugs.includes(slug))

const mobileViewport: ViewportSize = devices['iPhone 6'].viewport

/** Custom CSS for the header */
const customCss = `
/* Custom Header CSS */
:root {
  --scalar-custom-header-height: 50px;
}
.custom-header {
  height: var(--scalar-custom-header-height);
  background-color: var(--scalar-background-2);
  border-bottom: var(--scalar-border-width) solid var(--scalar-border-color);
  color: var(--scalar-color-2);
  font-size: var(--scalar-font-size-3);
  padding: 0 18px;
  position: sticky;
  display: flex;
  align-items: center;
  top: 0;
  z-index: 100;
}`

/** Injects the custom header into the page */
const injectHeader = async (page: Page) => {
  await page.evaluate(() => {
    const header = document.createElement('header')
    header.className = 'custom-header scalar-app'
    header.innerHTML = 'Custom Header'
    document.body.prepend(header)
  })
}

/** Options for the page screenshots */
const getScreenshotOptions = (page: Page) =>
  ({
    mask: [
      page.getByRole('region', { name: 'Introduction' }), // Hide the introduction section
      page.locator('aside > ul'), // Hide the sidebar contents
    ],
    maskColor: '#eee',
  }) satisfies ScreenshotOptions

/**
 * Takes snapshots of the custom header
 */
toTest.forEach((source) => {
  const { slug } = source

  test.describe('Desktop', () => {
    test(source.title, async ({ page }) => {
      const example = await serveExample({ ...source, customCss })
      await page.goto(example)
      await injectHeader(page)

      /** Options for the page screenshots */
      const opts = getScreenshotOptions(page)

      await expect(page.locator('.custom-header')).toBeVisible()
      await expect(page).toHaveScreenshot(`${slug}-header.png`, opts)
    })
  })

  test.describe('Mobile', () => {
    test.use({ viewport: mobileViewport })
    test(source.title, async ({ page }) => {
      const example = await serveExample({ ...source, customCss })

      if (isClassic(source)) {
        await page.goto(example)
      } else {
        // Navigate to a specific section so the breadcrumb is consistent
        await page.goto(`${example}#description/introduction`)
      }

      await injectHeader(page)

      /** Options for the page screenshots */
      const opts = getScreenshotOptions(page)

      await expect(page.locator('.custom-header')).toBeVisible()
      await expect(page).toHaveScreenshot(`${slug}-header-mobile.png`, opts)
    })
  })
})
