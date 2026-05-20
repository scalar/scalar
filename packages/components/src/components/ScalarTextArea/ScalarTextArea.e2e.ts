import { test } from '@test/helpers'

const shortContent = 'Hello, world!'
const longContent = `First he wanted to stand up quietly and undisturbed, get dressed, above all
have breakfast, and only then consider further action, for (he noticed this
clearly) by thinking things over in bed he would not reach a reasonable
conclusion. He remembered that he had already often felt a light pain or other
in bed, perhaps the result of an awkward lying position, which later turned
out to be purely imaginary when he stood up, and he was eager to see how his
present fantasies would gradually dissipate. That the change in his voice was
nothing other than the onset of a real chill, an occupational illness of
commercial travelers, of that he had not the slightest doubt.`

const stories = ['Base', 'With Max Height'] as const satisfies string[]

test.describe('ScalarTextArea', () => {
  test.use({ background: true })

  stories.forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      await snapshot('1-empty')
      await page.getByRole('textbox').click()
      await snapshot('2-focused')
      await page.getByRole('textbox').fill(shortContent)
      await snapshot('3-short-content')
      await page.getByRole('textbox').fill(longContent)
      await snapshot('4-long-content')

      if (story === 'With Max Height') {
        await page.getByRole('textbox').press('PageDown')
        await snapshot('5-scrolled')
      }
    }),
  )
})
