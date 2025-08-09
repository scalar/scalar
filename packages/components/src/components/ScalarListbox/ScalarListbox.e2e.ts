import { test } from '@test/helpers'

test.describe('ScalarListbox', () =>
  ['Base', 'Multiselect', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Basic open state
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')

      // One option selected
      await page.getByRole('option').nth(2).click()
      if (story !== 'Multiselect') {
        // Reopen the dropdown if were in single select
        await page.getByRole('button', { expanded: false }).click()
      } else {
        // Select another option in multiselect
        await page.getByRole('option').nth(1).click()
      }

      await snapshot('2-selected')
    }),
  ))
