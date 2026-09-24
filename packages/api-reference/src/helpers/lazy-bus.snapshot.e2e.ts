import { expect, test } from '@test/helpers'

// These stories need interaction and geometry assertions: an initial screenshot cannot
// detect a heading hidden behind a header or an ancestor that never scrolled.
test.describe('LazyBus', () => {
  for (const [story, expectedTop] of [
    ['Sidebar', 0],
    ['Sticky Header', 60],
    ['Stacked Headers', 100],
    ['Nested Container', 60],
    ['Existing Margin', 100],
    ['Decorative Background', 60],
  ] as const) {
    test(story, async ({ page }) => {
      const target = page.getByRole('heading', { name: 'Scroll target' })
      const originalStyle = await target.getAttribute('style')
      await page.getByRole('button', { name: 'Scroll to target' }).click()
      await expect.poll(async () => (await target.boundingBox())?.y).toBe(expectedTop)
      // Repeated calls model the lazy-render freeze loop and must not drift.
      await page.getByRole('button', { name: 'Scroll to target' }).click()
      await expect.poll(async () => (await target.boundingBox())?.y).toBe(expectedTop)
      expect(await target.getAttribute('style')).toBe(originalStyle)
      if (story === 'Nested Container') {
        expect(await page.locator('main').evaluate((element) => element.scrollTop)).toBeGreaterThan(0)
      }
    })
  }
})
