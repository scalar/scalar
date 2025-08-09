import { test } from '@test/helpers'

test.describe('ScalarDropdown', () =>
  ['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the dropdown
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()
    }),
  ))
