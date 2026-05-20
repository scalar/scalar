import { test } from '@test/helpers'

test.describe('ScalarListbox', () => {
  ;['Base', 'Multiselect', 'Custom Classes'].forEach((story) =>
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
  )

  test.describe(() => {
    test.use({ component: 'ScalarListbox', crop: 'viewport' })

    test('Scrolling', async ({ page, snapshot }) => {
      await page.getByRole('button', { expanded: false }).click() // Open the dropdown
      await snapshot('1-open')

      await page.getByRole('button', { expanded: true }).click() // Close the dropdown

      // Set viewport to a small height so that the dropdown is clipped
      await page.setViewportSize({ width: 640, height: 320 })

      await page.getByRole('button', { expanded: false }).click() // Open the dropdown
      await snapshot('2-resized')

      // Scroll to the bottom of the page
      await page.mouse.wheel(0, 1000)

      await snapshot('3-scrolled')
    })
  })
})
