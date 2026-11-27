import { expect, test } from '@test/helpers'

// These stories need interaction and geometry assertions: an initial screenshot cannot
// detect a heading hidden behind a header or an ancestor that never scrolled.
test.describe('LazyBus', () => {
  for (const story of ['Late Layout', 'Nested Lazy Layout']) {
    test(story, async ({ page }) => {
      const target = page.getByRole('heading', { name: 'Scroll target' })
      await page.evaluate(() => {
        document.documentElement.style.overflowAnchor = 'none'
      })
      await page.getByRole('button', { name: 'Scroll to target' }).click()
      await expect(page.locator('[data-layout-shifted="true"]')).toHaveCount(1)
      await expect.poll(async () => (await target.boundingBox())?.y).toBe(60)
    })
  }

  test.describe('native anchoring', () => {
    test.use({ component: 'LazyBus', story: 'Late Layout' })
    test('keeps the target aligned while the browser anchors changing content', async ({ page }) => {
      await page.getByRole('button', { name: 'Scroll to target' }).click()
      await expect(page.locator('[data-layout-shifted="true"]')).toHaveCount(1)
      await expect
        .poll(async () => (await page.getByRole('heading', { name: 'Scroll target' }).boundingBox())?.y)
        .toBe(60)
    })
  })

  test.describe('scrollbar navigation', () => {
    for (const story of ['Late Layout', 'Nested Lazy Layout']) {
      test.describe(story, () => {
        test.use({ component: 'LazyBus', story })

        test('keeps a scroll movement that has no pointer input', async ({ page }) => {
          const result = await page.evaluate(async () => {
            document.documentElement.style.overflowAnchor = 'none'
            const button = document.querySelector<HTMLButtonElement>('button')
            const main = document.querySelector('main')
            if (!button || !main) {
              throw new Error('Navigation story is missing its controls')
            }
            button.click()
            await new Promise<void>((resolve) => requestAnimationFrame(() => requestAnimationFrame(() => resolve())))
            // Scrollbar drags do not send a pointerdown event to the page in Chromium.
            const container = getComputedStyle(main).overflowY === 'auto' ? main : document.documentElement
            const requested = container.scrollTop + 200
            container.scrollTop = requested
            await new Promise((resolve) => setTimeout(resolve, 120))
            return { requested, actual: container.scrollTop }
          })
          expect(result.actual).toBe(result.requested)
        })
      })
    }
  })

  for (const [story, expectedTop] of [
    ['Sidebar', 0],
    ['Sticky Header', 60],
    ['Stacked Headers', 100],
    ['Nested Container', 60],
    ['Existing Margin', 100],
    ['Decorative Background', 60],
    ['Unregistered Overlay', 60],
    ['Registered Mobile Header', 50],
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
