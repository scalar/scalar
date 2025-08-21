import { test, expect } from '@playwright/test'
import sources from '../test/data/sources.js'

sources.forEach(({ title, slug }) => {
  test(`Diff with CDN - ${title}`, async ({ page }) => {
    const filename = `snapshot-${slug}.png`
    const path = test.info().snapshotPath(filename, { kind: 'screenshot' })

    // Capture screenshot of CDN
    await page.goto(`cdn?api=${slug}`, { waitUntil: 'networkidle' })
    await page.screenshot({ path, fullPage: true })

    // Compare with local
    await page.goto(`?api=${slug}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot(filename, { fullPage: true })
  })
})
