import { expect, takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'Responsive', 'With Menu']

test.describe('ScalarHeader', () => {
  stories.forEach((story) => test(story, takeSnapshot))

  /**
   * Regression lock for #9223, where the header grew past a 375px viewport.
   *
   * Chromium only, so it covers the layout contract rather than the WebKit
   * behaviour that originally surfaced the bug.
   */
  test.describe('Overflow', () => {
    test.use({
      component: 'ScalarHeader',
      story: 'Overflow',
      viewport: { width: 375, height: 480 },
    })

    test('Overflow', takeSnapshot)

    test('shrinks to the viewport instead of pushing past it', async ({ page }) => {
      // The header is block-level, so its own box is capped by the viewport no
      // matter how far its contents spill. Overflow shows up as a scrollable
      // header and a horizontally scrollable page, which is what a user sees.
      const overflow = await page.evaluate(() => {
        const header = document.querySelector('header')
        return {
          header: header ? header.scrollWidth - header.clientWidth : -1,
          page: document.documentElement.scrollWidth,
        }
      })

      expect(overflow.header).toBeLessThanOrEqual(0)
      expect(overflow.page).toBeLessThanOrEqual(375)
    })

    test('ellipsizes the long label rather than overflowing its column', async ({ page }) => {
      const label = page.getByTestId('overflow-label')

      // Clipped, not removed: the text stays available to assistive tech.
      const { clientWidth, scrollWidth } = await label.evaluate((el) => ({
        clientWidth: el.clientWidth,
        scrollWidth: el.scrollWidth,
      }))

      expect(scrollWidth).toBeGreaterThan(clientWidth)
    })
  })
})
