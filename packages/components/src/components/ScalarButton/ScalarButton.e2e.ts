import { test, themes } from '@test/helpers'

const stories = ['Base', 'With Icon']
const sizes = { 'Extra Small': 'xs', 'Small': 'sm', 'Medium': 'md' } as const
const variants = {
  'Solid': 'solid',
  'Outlined': 'outlined',
  'Ghost': 'ghost',
  'Gradient': 'gradient',
  'Danger': 'danger',
} as const

test.describe('ScalarButton', () => {
  test.use({ component: 'ScalarButton', crop: 'component', background: true })
  // For each variant
  Object.entries(variants).forEach(([variantLabel, variant]) =>
    test.describe(variantLabel, () => {
      test.use({ args: { variant } })

      test.describe(() => {
        // Test the hover state for each variant in both color modes
        test.use({ colorModes: ['light', 'dark'] })
        test('Base', async ({ page, snapshot }) => {
          await snapshot(`${variant}-md`)
          await page.getByRole('button').hover()
          await snapshot(`${variant}-md-hover`)
        })
      })

      // Test the disabled state for each variant
      // For disabled we want to make sure the hover state does not change
      test('Disabled', async ({ page, snapshot }) => {
        await snapshot(variant)
        await page.getByRole('button').hover()
        await snapshot(variant)
      })

      // For each size
      Object.entries(sizes).forEach(([sizeLabel, size]) =>
        test.describe(sizeLabel, () => {
          test.use({ args: { variant, size } })

          // Test each size for each story
          stories.forEach((story) =>
            test(story, async ({ snapshot }) => {
              await snapshot(`${variant}-${size}`)
            }),
          )

          // For loading we want to see the loading state
          test('Loading', async ({ page, snapshot }) => {
            await page.getByRole('button').click()
            await snapshot(`${variant}-${size}`)
          })
        }),
      )
    }),
  )

  /**
   * The button carries the base radius, so it is the cheapest check that --scalar-radius itself is
   * honoured. At a large radius a medium button is shorter than twice the radius, which forces the
   * corners to cap into a pill rather than overflowing.
   */
  themes.forEach((theme) =>
    test.describe(`Theme ${theme}`, () => {
      test.use({ component: 'ScalarButton', theme, args: { variant: 'solid', size: 'md' } })

      test('Base', async ({ snapshot }) => await snapshot())
    }),
  )
})
