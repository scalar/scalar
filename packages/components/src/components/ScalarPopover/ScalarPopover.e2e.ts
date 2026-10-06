import { test } from '@test/helpers'

test.describe('ScalarPopover', () => {
  test.use({ colorModes: ['light', 'dark'] })

  ;['Base', 'Custom Classes'].forEach((story) =>
    test(story, async ({ page, snapshot }) => {
      // Open the popover
      await page.getByRole('button', { name: 'Click Me' }).click()
      await snapshot()
    }),
  )
})
