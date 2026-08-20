import { takeSnapshot, test } from '@test/helpers'

const stories = ['Base', 'JSON String', 'Bordered', 'Ligatures']

test.describe('ScalarCodeBlock', () => {
  test.use({ background: true })
  stories.forEach((story) => test(story, takeSnapshot))

  test('Single Line', async ({ page, snapshot }) => {
    await snapshot()

    // The copy button floats over the end of a one-liner, so the end of the line has to clear it
    await page
      .locator('.scalar-code-block .custom-scroll')
      .evaluate((element) => element.scrollTo({ left: element.scrollWidth }))

    await snapshot('scrolled')
  })
})
