import { type Device, type TestBody, test } from '@test/helpers'

import { ELEMENT_ID } from './constants'

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

test.describe('ScalarTooltip alignment', () => {
  // Edge-aligned placements (`-start` / `-end`) must line the tooltip's visible
  // edge up with the target's edge: the offset gap should only sit on the side
  // facing the target, never on the aligned edge. `top-start` is representative
  // of the case the offset bug regressed on. We reuse the Base story and drive
  // the placement through the story args.
  test.use({
    component: 'ScalarTooltip',
    story: 'Base',
    args: { placement: 'top-start' },
    viewport: { width: 320, height: 200 },
  })

  test('aligns the tooltip edge with the target', takeTooltipSnapshot('top-start'))
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
