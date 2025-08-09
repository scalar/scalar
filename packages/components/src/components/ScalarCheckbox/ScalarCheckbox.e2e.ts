import { test } from '@test/helpers'

const stories = ['Base', 'With Label']

test.describe('ScalarCheckbox', () => {
  test.use({ background: true }),
    stories.forEach((story) =>
      test(story, async ({ page, snapshot }) => {
        await snapshot('1-normal')
        await page.getByRole('checkbox').click()
        await snapshot('2-checked')
      }),
    )
})
