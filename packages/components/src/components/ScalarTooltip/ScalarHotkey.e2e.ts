import { ELEMENT_ID } from './constants'
import { testComponent } from '@test/testComponent'

testComponent('ScalarTooltip', {
  stories: ['Base', 'Hotkey', 'Label and Hotkey'],
  testFn: async ({ page, snapshot }) => {
    // Make the viewport smaller for the tooltip snapshots
    await page.setViewportSize({ width: 240, height: 160 })
    await page.getByRole('button', { name: 'Hover Me' }).hover() // Open the tooltip
    await page.waitForSelector(`#${ELEMENT_ID}`) // Wait for the tooltip to be visible
    await snapshot() // Take a snapshot of the open tooltip
  },
})
