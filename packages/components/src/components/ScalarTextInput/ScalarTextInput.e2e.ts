import { takeSnapshot, test } from '@test/helpers'

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
})
