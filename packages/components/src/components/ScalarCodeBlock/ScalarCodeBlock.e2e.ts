import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'JSON String', 'Bordered']

test.describe('ScalarCodeBlock', () => {
  // The ligature glyphs these snapshots guard cover a few hundred pixels, which the project wide
  // ratio would wave through, so hold these tests to an absolute budget instead
  test.use({ background: true, maxDiffPixels: 100 })
  stories.forEach((story) => test(story, takeSnapshot))

  test('Ligatures', async ({ page, snapshot }) => {
    // The component disables ligatures, so turn them back on to capture the glyphs it suppresses
    await page.addStyleTag({
      content: '.scalar-code-block pre { font-variant-ligatures: normal; }',
    })

    await snapshot()
  })

  test('Single Line', async ({ page, snapshot }) => {
    await snapshot()

    // The copy button floats over the end of a one-liner, so the end of the line has to clear it
    await page
      .locator('.scalar-code-block .custom-scroll')
      .evaluate((element) => element.scrollTo({ left: element.scrollWidth }))

    await snapshot('scrolled')
  })

  test('In Card', async ({ page, snapshot }) => {
    // Move the mouse over the code to reveal the copy button and its language label. Hovering the
    // locator would scroll it into view first, and the scroll position is what this test is about
    const box = await page.locator('.scalar-card-content:has(.scalar-code-block)').boundingBox()
    await page.mouse.move((box?.x ?? 0) + 20, (box?.y ?? 0) + 20)

    await snapshot()

    // The code block scrolls, not the card, so the copy button stays put in the corner
    await page
      .locator('.scalar-code-block .custom-scroll')
      .evaluate((element) => element.scrollTo({ left: element.scrollWidth }))

    await snapshot('scrolled')
  })
})
