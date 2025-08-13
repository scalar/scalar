import { test } from '@test/helpers'

test.describe('ScalarCombobox', () => {
  // Single select
  ;['Base', 'Groups'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Basic open state
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')

      // One option selected
      await page.getByRole('option').nth(2).click()
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('2-selected')

      // Filtering
      await page.getByRole('combobox').fill('an')
      await snapshot('3-filtered')

      // Select first option
      await page.getByRole('option').nth(0).click()
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('4-reselected')
    }),
  )
  // Multiselect
  ;['Multiselect', 'Multiselect Groups'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Basic open state
      await page.getByRole('button', { expanded: false }).click()
      await snapshot('1-open')

      // One option selected
      await page.getByRole('option').nth(2).click()
      await snapshot('2-selected')

      // Filtering
      await page.getByRole('combobox').fill('an')
      await snapshot('3-filtered')

      // Select first option
      await page.getByRole('option').nth(0).click()
      await page.getByRole('combobox').fill('')
      await snapshot('4-reselected')
    }),
  )
})
