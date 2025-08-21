import { test, expect } from '@playwright/test'
import sources from '../test/data/sources.js'

sources.forEach(({ title, slug }) => {
  test(`CDN Snapshot - ${title}`, async ({ page }) => {
    await page.goto(`cdn?api=${slug}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot(`snapshot-${slug}.png`, { fullPage: true })
  })
})
