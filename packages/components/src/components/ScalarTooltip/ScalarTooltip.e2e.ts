import { test, type Device, type TestBody } from '@test/helpers'

import { ELEMENT_ID } from '@/components/ScalarTooltip/constants'

/** Opens the tooltip and takes a snapshot */
const takeTooltipSnapshot =
  (suffix?: string): TestBody =>
  async ({ page, snapshot }) => {
    // Make the viewport smaller for the tooltip snapshots

    await page.getByRole('button', { name: 'Hover Me' }).hover() // Open the tooltip
    await page.waitForSelector(`#${ELEMENT_ID}`) // Wait for the tooltip to be visible
    await snapshot(suffix) // Take a snapshot of the open tooltip
  }

test.use({
  viewport: { width: 240, height: 160 },
  background: true,
})

test.describe('ScalarTooltip', () => {
  test.use({ colorModes: ['light', 'dark'] })
  test('Base', takeTooltipSnapshot())
})

test.describe('ScalarHotkeyTooltip', () => {
  const stories = ['Hotkey', 'Label and Hotkey']

  const devices: Device[] = ['Safari', 'Chrome']

  test.use({ component: 'ScalarTooltip' })

  devices.forEach((device) => {
    test.describe(device, () => {
      test.use({ device })
      stories.forEach((story) => test(story, takeTooltipSnapshot(device)))
    })
  })
})
