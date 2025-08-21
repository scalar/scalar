import { test, expect } from '@playwright/test'
import sources from '../test/data/sources.js'

sources.forEach(({ title, slug }) => {
  test(`CDN Diff - ${title}`, async ({ page }) => {
    await page.goto(`?api=${slug}`, { waitUntil: 'networkidle' })
    await expect(page).toHaveScreenshot(`snapshot-${slug}.png`, { fullPage: true })
  })
})
