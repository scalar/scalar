import { test } from '@test/helpers'

const stories = ['Base', 'Ghost', 'Danger', 'Disabled', 'Loading']

test.describe('ScalarButton', () => {
  test.use({ crop: true })
  stories.forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      await snapshot('1-normal')
      await page.getByRole('button').hover()
      await snapshot('2-hover')
    }),
  )
})
