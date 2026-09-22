import { test } from '@test/helpers'

test.describe('ScalarDropdown', () =>
  ['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the dropdown
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()

      if (story === 'Base') {
        await page.getByRole('menuitem', { name: 'An item', exact: true }).hover()
        await snapshot('hover')
      }
    }),
  ))
