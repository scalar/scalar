import { expect, test } from '@test/helpers'

test.describe('ScalarCombobox', () => {
  // Single select
  ;['Base', 'Groups'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Basic open state
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')

      // One option selected
      await page.getByRole('option').nth(2).click()
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('2-selected')

      // Filtering
      await page.getByRole('combobox').fill('an')
      await snapshot('3-filtered')

      // Select first option
      await page.getByRole('option').nth(0).click()
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('4-reselected')
    }),
  )
  // Multiselect
  ;['Multiselect', 'Multiselect Groups'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Basic open state
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')

      // One option selected
      await page.getByRole('option').nth(2).click()
      await snapshot('2-selected')

      // Filtering
      await page.getByRole('combobox').fill('an')
      await snapshot('3-filtered')

      // Select first option
      await page.getByRole('option').nth(0).click()
      await page.getByRole('combobox').fill('')
      await snapshot('4-reselected')
    }),
  )

  test.describe(() => {
    // Floating surfaces lift to `bg-b-1.5` in dark mode, so cover one story against the page background
    test.use({ component: 'ScalarCombobox', story: 'Base', colorModes: ['dark'], background: true })

    test('Dark mode', async ({ page, snapshot }) => {
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')
    })
  })
})

for (const story of ['Delayed Positioning', 'Delayed Multiselect']) {
  test.describe(`ScalarCombobox ${story}`, () => {
    test.use({ component: 'ScalarCombobox', story })

    test('scrolls keyboard navigation instantly with reduced motion', async ({ page }) => {
      await page.emulateMedia({ reducedMotion: 'reduce' })
      await page.getByRole('button', { name: /Choose option/ }).click()
      await page.evaluate(() => document.dispatchEvent(new Event('position-picker')))
      await expect(page.getByRole('status')).toHaveText('Positioned')
      const listbox = page.getByRole('listbox')
      await listbox.evaluate((element) => {
        const scrollBy = element.scrollBy.bind(element)
        element.scrollBy = (options?: ScrollToOptions | number, y?: number): void => {
          if (typeof options === 'number') {
            scrollBy(options, y ?? 0)
            return
          }
          element.dataset.scrollBehavior = options?.behavior
          scrollBy(options)
        }
      })

      for (let index = 0; index < 14; index++) {
        await page.getByRole('combobox').press('ArrowDown')
      }

      await expect(listbox).toHaveAttribute('data-scroll-behavior', 'instant')
      await expect(page.getByRole('option', { name: 'Option 39', exact: true })).toBeInViewport()
    })

    test('preserves outer scrolling while opening and navigating before positioning', async ({ page }) => {
      const outer = page.getByLabel('Outer scroller')
      await outer.evaluate((element) => {
        element.scrollTop = 550
      })
      await page.evaluate(() => window.scrollTo(0, 9900))
      const initialScroll = await page.evaluate(() => window.scrollY)
      const outerScroll = await outer.evaluate((element) => element.scrollTop)

      await page.getByRole('button', { name: /Choose option/ }).click()
      const search = page.getByRole('combobox')
      await expect(search).toBeFocused()
      await expect(page.getByRole('status')).toHaveText('Waiting for positioning')
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll)
      expect(await outer.evaluate((element) => element.scrollTop)).toBe(outerScroll)

      await search.press('ArrowDown')
      await expect(search).toHaveAttribute('aria-activedescendant', /-26$/)
      await search.press('ArrowUp')
      await expect(search).toHaveAttribute('aria-activedescendant', /-25$/)
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll)

      await page.evaluate(() => document.dispatchEvent(new Event('position-picker')))
      await expect(page.getByRole('status')).toHaveText('Positioned')
      await expect(page.getByRole('option', { name: 'Option 25', exact: true })).toBeInViewport()
      await expect(search).toBeFocused()
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll)
      expect(await outer.evaluate((element) => element.scrollTop)).toBe(outerScroll)

      // Scrolling the list remains possible after it is positioned.
      for (let index = 0; index < 14; index++) {
        await search.press('ArrowDown')
      }
      await expect(page.getByRole('option', { name: 'Option 39', exact: true })).toBeInViewport()
      expect(await page.evaluate(() => window.scrollY)).toBe(initialScroll)
      expect(await outer.evaluate((element) => element.scrollTop)).toBe(outerScroll)
    })
  })
}
