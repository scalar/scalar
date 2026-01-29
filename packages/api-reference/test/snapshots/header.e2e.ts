import { type Page, type ViewportSize, devices, expect, test } from '@playwright/test'
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

/**
 * Takes snapshots of the custom header
 */
toTest.forEach((source) => {
  const { slug } = source

  test(source.title, async ({ page }) => {
    const example = await serveExample({ ...source, customCss })
    await page.goto(example)
    await injectHeader(page)

    await expect(page.locator('.custom-header')).toBeVisible()
    await expect(page).toHaveScreenshot(`${slug}-header.png`)

    await page.setViewportSize(mobileViewport)
    await expect(page.locator('.custom-header')).toBeVisible()
    await expect(page).toHaveScreenshot(`${slug}-header-mobile.png`)
  })
})
