import { takeSnapshot, test, themes } from '@test/helpers'

test.describe('ScalarTextInput', () => {
  test.use({ background: true })

  const contentStories = ['Base', 'With Prefix', 'With Suffix', 'With Aside'] as const satisfies string[]

  const shortContent = 'scalar.com'
  const longContent = 'First he wanted to stand up quietly and undisturbed, get dressed, above all have breakfast.'

  contentStories.forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      await snapshot('1-empty')
      await page.getByRole('textbox').click()
      await snapshot('2-focused')
      await page.getByRole('textbox').fill(shortContent)
      await snapshot('3-short-content')
      await page.getByRole('textbox').fill(longContent)
      await snapshot('4-long-content')
    }),
  )

  const staticStories = ['Readonly', 'With Copy'] as const satisfies string[]

  staticStories.forEach((story) => test(story, takeSnapshot))

  /**
   * The reset rounds both the input and its focus outline from --scalar-radius, and DOC-5787 was a
   * focus ring pinned to a literal while the input itself followed the theme. Snapshotting the
   * focused state is what would catch that pairing coming apart again.
   */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarTextInput', theme })

      test('Base', async ({ page, snapshot }) => {
        await snapshot()
        await page.getByRole('textbox').click()
        await snapshot('focused')
      })
    }),
  )
})
