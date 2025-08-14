import { test } from '@test/helpers'

import { ELEMENT_ID } from '@/components/ScalarTooltip/constants'
import type { TestBody } from '@test/helpers'

/** Opens the tooltip and takes a snapshot */
const takeTooltipSnapshot: TestBody = async ({ page, snapshot }) => {
  // Make the viewport smaller for the tooltip snapshots

  await page.getByRole('button', { name: 'Hover Me' }).hover() // Open the tooltip
  await page.waitForSelector(`#${ELEMENT_ID}`) // Wait for the tooltip to be visible
  await snapshot() // Take a snapshot of the open tooltip
}

test.describe('ScalarTooltip', () => {
  test.use({
    viewport: { width: 240, height: 160 },
    background: true,
    colorModes: ['light', 'dark'],
  })

  test('Base', takeTooltipSnapshot)

  const stories = ['Hotkey', 'Label and Hotkey']
  stories.forEach((story) => test(story, takeTooltipSnapshot))
})
