import type { Locator, Page } from '@playwright/test'
import { contrastRatio, expect, test } from '@test/helpers'
import { setColorMode, themes } from '@test/shared'

/** Non-text contrast minimum for a focus indicator under WCAG 1.4.11. */
const MINIMUM_FOCUS_RING_CONTRAST = 3

/**
 * Reads the focus ring color of an item and the background it sits on.
 *
 * The ring is drawn at the item's edge, so the surface behind it is the item's own background when
 * it paints one and the nearest painted ancestor (the sidebar) otherwise.
 */
const readFocusRing = (item: Locator) =>
  item.evaluate((element) => {
    const isTransparent = (color: string) => color === 'transparent' || /^rgba\(.*,\s*0\)$/.test(color)
    const style = getComputedStyle(element)

    let surface: Element | null = element
    let background = style.backgroundColor
    while (surface && isTransparent(background)) {
      surface = surface.parentElement
      background = surface ? getComputedStyle(surface).backgroundColor : 'rgb(255, 255, 255)'
    }

    return { outlineStyle: style.outlineStyle, outlineColor: style.outlineColor, background }
  })

const expectLegibleFocusRing = async (page: Page, item: Locator) => {
  for (const colorMode of ['light', 'dark'] as const) {
    await setColorMode(page, colorMode)
    const ring = await readFocusRing(item)

    expect(ring.outlineStyle, `${colorMode}: ring is shown for keyboard focus`).toBe('solid')
    expect(
      contrastRatio(ring.outlineColor, ring.background),
      `${colorMode}: ${ring.outlineColor} on ${ring.background}`,
    ).toBeGreaterThanOrEqual(MINIMUM_FOCUS_RING_CONTRAST)
  }
}

test.describe('ScalarSidebar', () => {
  test('Base', async ({ page, snapshot }) => {
    await snapshot('1-collapsed')

    await page.getByRole('button', { name: 'Level 1 Group' }).click()
    await page.getByRole('button', { name: 'Level 2 Group' }).click()

    await snapshot('2-expanded')
  })
  test('Themed', async ({ page, snapshot }) => {
    await page.getByRole('button', { name: 'Level 1 Group' }).click()
    await page.getByRole('button', { name: 'Level 2 Group' }).click()
    await page.mouse.move(0, 0) // Move the mouse to the top of the page to avoid hover states
    await snapshot('1-base')
    await page.getByRole('button', { name: 'Subitem 3' }).hover()
    await snapshot('2-hover')
    await page.getByRole('button', { name: 'Subitem 3' }).click()
    await snapshot('3-selected')
  })

  test('Discrete Groups', async ({ page, snapshot }) => {
    await snapshot('1-collapsed')

    await page.getByRole('button', { name: 'Open Level 1 Group' }).click()
    await snapshot('2-expanded')

    await page.getByRole('button', { name: 'Level 2 Group', exact: true }).click()
    await snapshot('3-selected')
  })

  test('Loading Groups', async ({ page, snapshot }) => {
    await snapshot('1-base')

    await page.getByRole('button', { name: 'Nested Items Loading' }).click()
    await snapshot('2-nested')
  })

  /**
   * Items carry no focus styling of their own, so the ring is the reset outline. It has to stay
   * legible on the selected item's background as well as on the plain sidebar, in both color modes.
   */
  test.describe('Focused', () => {
    test.use({ component: 'ScalarSidebar', story: 'Base', colorModes: ['light', 'dark'] })

    test('Keyboard focus ring', async ({ page, snapshot }) => {
      await page.getByRole('button', { name: 'Level 1 Group' }).click()
      await page.getByRole('button', { name: 'Level 2 Group' }).click()

      const selected = page.getByRole('button', { name: 'Subitem 3' })
      await selected.click()
      // A click focuses the item without :focus-visible, so leave and come back by keyboard
      await page.keyboard.press('Tab')
      await page.keyboard.press('Shift+Tab')
      await snapshot('focused-selected')
      await expectLegibleFocusRing(page, selected)

      // The neighbouring item has no background of its own, so its ring sits on the sidebar
      await page.keyboard.press('Tab')
      await expectLegibleFocusRing(page, page.locator(':focus'))
    })
  })

  /** The sidebar items use rounded-lg, which is the only coverage of that step in the scale. */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarSidebar', theme })

      test('Base', async ({ page, snapshot }) => {
        await page.getByRole('button', { name: 'Level 1 Group' }).click()
        await snapshot()
      })
    }),
  )
})
