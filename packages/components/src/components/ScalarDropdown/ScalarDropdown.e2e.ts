import { test } from '@test/helpers'

test.describe('ScalarDropdown', () => {
  ;['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the dropdown
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()

      if (story === 'Base') {
        await page.getByRole('menuitem', { name: 'An item', exact: true }).hover()
        await snapshot('hover')
      }
    }),
  )

  test.describe(() => {
    // Floating surfaces lift to `bg-b-1.5` in dark mode, so cover one story against the page background
    test.use({ component: 'ScalarDropdown', story: 'Base', colorModes: ['dark'], background: true })

    test('Dark mode', async ({ page, snapshot }) => {
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()

      // The hovered item has to stay visible against the lifted surface
      await page.getByRole('menuitem', { name: 'An item', exact: true }).hover()
      await snapshot('hover')
    })
  })
})
