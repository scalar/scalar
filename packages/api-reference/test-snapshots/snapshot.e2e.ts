import { test, expect, type Page } from '@playwright/test'
import sources from '../test/data/sources'

/**
 * Wait for the ARIA snapshot (e.g. the dom structure) to stabilize
 */
async function waitForStableAriaSnapshot(page: Page, options?: { matches?: number; polling?: number }) {
  const { matches = 3, polling = 400 } = options ?? {}

  let matched = 0
  let oldSnapshot = 'old'
  let newSnapshot = 'new'
  while (true) {
    // Get the new snapshot
    newSnapshot = await page.locator('body').ariaSnapshot()

    // Count the number of matched snapshots
    matched = newSnapshot === oldSnapshot ? matched + 1 : 0

    // If they match the count we can return
    if (matched === matches) {
      return
    }

    // Otherwise set the old snapshot to the new snapshot
    oldSnapshot = newSnapshot
    newSnapshot = ''

    await page.waitForTimeout(polling)
  }
}

test.describe.configure({ mode: 'parallel', timeout: 45000 })

sources.forEach(({ title, slug }) => {
  test(`Diff with CDN - ${title}`, async ({ page }) => {
    const filename = `snapshot-${slug}.png`
    const path = test.info().snapshotPath(filename, { kind: 'screenshot' })

    // Wait longer between polling intervals on CI
    const polling = process.env.CI ? 800 : 400

    // Capture screenshot of CDN
    await page.goto(`cdn?api=${slug}`, { waitUntil: 'networkidle' })
    await waitForStableAriaSnapshot(page, { polling })
    await page.screenshot({ path, fullPage: true })

    // Compare with local
    await page.goto(`?api=${slug}`, { waitUntil: 'networkidle' })
    await waitForStableAriaSnapshot(page, { polling })
    await expect(page).toHaveScreenshot(filename, { fullPage: true })
  })
})
