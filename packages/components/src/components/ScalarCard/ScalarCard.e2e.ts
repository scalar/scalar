import type { Locator } from '@playwright/test'
import { expect, takeSnapshot, test } from '@test/helpers'
import { themes } from '@test/shared'

/** How far a band's contents sit from the card's outer edge and from the surface beside them */
type BandGaps = { edge: number; surface: number }

/**
 * Measures how far the contents of a card's header and footer sit from the card's outer edge and
 * from the surface beside them, using each band's content box so its own padding is accounted for.
 */
const measureBands = (card: Locator): Promise<{ header: BandGaps; footer: BandGaps }> =>
  card.evaluate((element) => {
    const header = element.querySelector<HTMLElement>(':scope > .scalar-card-header')
    const footer = element.querySelector<HTMLElement>(':scope > .scalar-card-footer')
    const surface = element.querySelector<HTMLElement>(
      ':scope > .scalar-card-content:not(.scalar-card-header, .scalar-card-footer)',
    )
    const contentBox = (band: HTMLElement) => {
      const box = band.getBoundingClientRect()
      const style = getComputedStyle(band)
      return {
        top: box.top + Number.parseFloat(style.paddingTop),
        bottom: box.bottom - Number.parseFloat(style.paddingBottom),
      }
    }
    const cardBox = element.getBoundingClientRect()
    const surfaceBox = surface!.getBoundingClientRect()
    const headerContent = contentBox(header!)
    const footerContent = contentBox(footer!)

    return {
      header: { edge: headerContent.top - cardBox.top, surface: surfaceBox.top - headerContent.bottom },
      footer: { edge: cardBox.bottom - footerContent.bottom, surface: footerContent.top - surfaceBox.bottom },
    }
  })

test.describe('ScalarCard', () => {
  ;['Base', 'With Actions', 'Minimal'].forEach((story) => test(story, takeSnapshot))

  /**
   * The header and footer sit on the card with its padding on their outer side only, so without
   * help their contents drift toward the surface. They should sit halfway between the two, and a
   * card without padding must not be shifted at all.
   */
  test.describe('Header and footer', () => {
    test.use({ component: 'ScalarCard', story: 'Base' })

    test('centers their contents between the card edge and the surface', async ({ mountedStory }) => {
      const bands = await measureBands(mountedStory.locator('.scalar-card'))

      expect(bands.header.edge).toBeCloseTo(bands.header.surface, 1)
      expect(bands.footer.edge).toBeCloseTo(bands.footer.surface, 1)
    })

    test.describe('without card padding', () => {
      test.use({ args: { class: 'p-0' } })

      test('keeps their contents centered', async ({ mountedStory }) => {
        const card = mountedStory.locator('.scalar-card')
        const bands = await measureBands(card)

        await expect(card).toHaveCSS('padding-top', '0px')
        expect(bands.header.edge).toBeCloseTo(bands.header.surface, 1)
        expect(bands.footer.edge).toBeCloseTo(bands.footer.surface, 1)
      })
    })
  })

  /**
   * The card is the only component whose sections inherit their corners from the parent via
   * rounded-t-[inherit] and rounded-b-[inherit], so it is what proves the derived --scalar-radius-xl
   * reaches nested elements rather than stopping at the container.
   */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarCard', theme })

      test('With Actions', takeSnapshot)
    }),
  )
})
