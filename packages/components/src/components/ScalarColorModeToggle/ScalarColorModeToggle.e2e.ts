import { test, themes } from '@test/helpers'

test.describe('ScalarColorModeToggle', () => {
  test.use({ crop: 'component', scale: 4 })

  test('Button', async ({ page, snapshot }) => {
    await snapshot()
    await page.getByRole('button', { name: 'Set dark mode' }).click()
    await snapshot('pressed')
  })

  test.describe(() => {
    test.use({ background: true })
    test('Icon', async ({ page, snapshot }) => {
      await snapshot()
      await page.getByRole('button', { name: 'Set dark mode' }).click()
      await snapshot('pressed')
    })
  })

  /**
   * The toggle is the clearest case of a themed radius wrapping a fixed one: the track uses
   * rounded-xl while the knob uses rounded-full. Both derive from --scalar-radius, so the rounded
   * none theme flattens the two together, while the sun and moon icon keeps its own 50% and stays
   * round under every theme.
   */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarColorModeToggle', theme })

      test('Button', async ({ snapshot }) => await snapshot())
    }),
  )
})
