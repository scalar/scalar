import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

import { sources } from '../utils/sources'

const cdn = 'https://cdn.jsdelivr.net/npm/@scalar/api-reference' as const

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

sources.forEach((source) => {
  test(`Diff with CDN - ${source.title}`, async ({ page }) => {
    const filename = `snapshot-${source.slug}.png`
    const path = test.info().snapshotPath(filename, { kind: 'screenshot' })

    // Wait longer between polling intervals on CI
    const polling = process.env.CI ? 800 : 400

    // Capture screenshot of CDN
    const cdnExample = await serveExample({ ...source, cdn })
    await page.goto(cdnExample, { waitUntil: 'networkidle' })
    await waitForStableAriaSnapshot(page, { polling })
    await page.screenshot({ path, fullPage: true })

    // Compare with local
    const localExample = await serveExample(source)
    await page.goto(localExample, { waitUntil: 'networkidle' })
    await waitForStableAriaSnapshot(page, { polling })
    await expect(page).toHaveScreenshot(filename, { fullPage: true })
  })
})
