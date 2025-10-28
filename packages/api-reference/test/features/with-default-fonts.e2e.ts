import { expect, test } from '@playwright/test'
import { serveExample } from '@test/utils/serve-example'

test.describe('withDefaultFonts', () => {
  test('loads default fonts from fonts.scalar.com', async ({ page }) => {
    const example = await serveExample()

    // Track all requests to fonts.scalar.com
    const fontRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).host === 'fonts.scalar.com') {
        fontRequests.push(request.url())
      }
    })

    await page.goto(example)

    // Verify that font requests were made to fonts.scalar.com
    expect(fontRequests.length).toBeGreaterThan(0)
  })

  test('does not load default fonts from fonts.scalar.com', async ({ page }) => {
    const example = await serveExample({
      withDefaultFonts: false,
    })

    // Track all requests to fonts.scalar.com
    const fontRequests: string[] = []
    page.on('request', (request) => {
      if (new URL(request.url()).host === 'fonts.scalar.com') {
        fontRequests.push(request.url())
      }
    })

    await page.goto(example)

    // Verify that no font requests were made to fonts.scalar.com
    expect(fontRequests).toHaveLength(0)
  })
})
