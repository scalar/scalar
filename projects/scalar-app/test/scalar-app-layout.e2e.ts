/**
 * Layout screenshots for the web app. After intentional UI changes, refresh baselines from
 * `projects/scalar-app` with: `CI=1 pnpm exec playwright test test/scalar-app-layout.e2e.ts --update-snapshots`
 * (or `pnpm test:e2e -- test/scalar-app-layout.e2e.ts --update-snapshots` when using the default local setup).
 */
import { type Page, type PageAssertionsToHaveScreenshotOptions, expect, test } from '@playwright/test'

import { waitForScalarAppShellReady } from './helpers/wait-for-scalar-app-shell-ready'

/** Path segment uses the same encoding as the collection editor e2e deep link. */
const OPERATION_OVERVIEW_ROUTE = '/@local/default/document/drafts/path/%252F/method/get/overview'
const OPERATION_EDITOR_ROUTE = '/@local/default/document/drafts/path/%252F/method/get/editor'

const viewport = { width: 1280, height: 800 } as const

const waitForFonts = async (page: Page): Promise<void> => {
  await page.evaluate(async () => {
    await document.fonts.ready
  })
}

test.describe('scalar-app-layout.e2e', () => {
  test('operation overview main matches snapshot', async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/', { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)

    await page.goto(OPERATION_OVERVIEW_ROUTE, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/method\/get\/overview/)

    const main = page.locator('main').first()
    await expect(main).toBeVisible({ timeout: 60_000 })
    await waitForFonts(page)

    const options = {
      animations: 'disabled',
    } satisfies PageAssertionsToHaveScreenshotOptions

    await expect(main).toHaveScreenshot('operation-overview-main.png', options)
  })

  test('operation editor page matches snapshot', async ({ page }) => {
    await page.setViewportSize(viewport)
    await page.goto('/', { waitUntil: 'load', timeout: 60_000 })
    await waitForScalarAppShellReady(page)

    await page.goto(OPERATION_EDITOR_ROUTE, { waitUntil: 'load', timeout: 60_000 })
    await expect(page).toHaveURL(/\/method\/get\/editor/)

    const monaco = page.locator('.monaco-editor').first()
    await monaco.waitFor({ state: 'visible', timeout: 60_000 })
    await waitForFonts(page)

    const options = {
      fullPage: true,
      animations: 'disabled',
    } satisfies PageAssertionsToHaveScreenshotOptions

    await expect(page).toHaveScreenshot('operation-editor-chrome.png', options)
  })
})
