import { ELEMENT_ID } from './constants'
import { test } from '@test/helpers'

const stories = ['Base', 'Hotkey', 'Label and Hotkey']

test.describe('ScalarTooltip', () => {
  test.use({ background: true, colorModes: ['light', 'dark'] }),
    stories.forEach((story) =>
      test(story, async ({ page, snapshot }) => {
        // Make the viewport smaller for the tooltip snapshots
        await page.setViewportSize({ width: 240, height: 160 })
        await page.getByRole('button', { name: 'Hover Me' }).hover() // Open the tooltip
        await page.waitForSelector(`#${ELEMENT_ID}`) // Wait for the tooltip to be visible
        await snapshot() // Take a snapshot of the open tooltip
      }),
    )
})
