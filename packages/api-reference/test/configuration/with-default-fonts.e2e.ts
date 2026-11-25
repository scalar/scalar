import { type Page, expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

/** Collects every font the page downloads, from any host. */
const trackFontRequests = (page: Page): string[] => {
  const fontRequests: string[] = []
  page.on('request', (request) => {
    if (request.resourceType() === 'font') {
      fontRequests.push(request.url())
    }
  })
  return fontRequests
}

/**
 * The reference uses the system font stack, so it should never download a web font.
 * `withDefaultFonts` is deprecated and kept only so existing configurations stay valid.
 */
test.describe('withDefaultFonts', () => {
  test('does not load web fonts by default', async ({ page }) => {
    const example = await serveExample()
    const fontRequests = trackFontRequests(page)

    await page.goto(example)
    // Wait for text to render, since that is when a page requests the fonts it uses
    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', level: 1 })).toBeVisible()

    expect(fontRequests).toEqual([])
  })

  test('does not load web fonts when withDefaultFonts is true', async ({ page }) => {
    const example = await serveExample({ withDefaultFonts: true })
    const fontRequests = trackFontRequests(page)

    await page.goto(example)
    await expect(page.getByRole('heading', { name: 'Scalar Galaxy', level: 1 })).toBeVisible()

    expect(fontRequests).toEqual([])
  })
})
