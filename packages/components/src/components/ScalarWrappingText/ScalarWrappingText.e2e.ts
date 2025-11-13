import { test } from '@test/helpers'

const stories = ['Base', 'Property']

test.describe('ScalarWrappingText', () => {
  stories.forEach((story) => {
    test.describe(() => {
      test.use({
        component: 'ScalarWrappingText',
        story,
        background: true,
      })

      test(`${story} - resizing viewport`, async ({ page, snapshot }) => {
        // Make the viewport wide
        await page.setViewportSize({ width: 800, height: 200 })
        await snapshot('1-wide')
        // Make the viewport narrower to trigger wrapping
        await page.setViewportSize({ width: 300, height: 200 })
        await snapshot('2-narrow')
        // Make it even narrower
        await page.setViewportSize({ width: 150, height: 200 })
        await snapshot('3-very-narrow')
      })
    })
  })
})
