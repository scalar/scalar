import type { Page } from '@playwright/test'
import { type Device, type TestBody, expect, test } from '@test/helpers'

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

// ---------------------------------------------------------------------------
// Top layer
// ---------------------------------------------------------------------------

/**
 * A `<dialog>` opened with `showModal()` is promoted to the browser's top layer,
 * which paints above every normal-flow element regardless of `z-index`. The tooltip
 * element is a singleton appended to `<body>`, so it lands underneath.
 *
 * Visibility assertions cannot catch this, which is worth stating plainly because it
 * is the obvious thing to reach for. Measured against the `In Dialog` story while the
 * bug was live, the hidden tooltip reported `display: block`, `opacity: 1` and a real
 * 106x32 bounding box, and `expect(tooltip).toBeVisible()` passed — on a tooltip the
 * user could not see at all. Playwright's notion of visibility is box plus computed
 * style; it does not model paint order or the top layer.
 *
 * So the check has to be geometric: ask the browser what it would actually paint at
 * the tooltip's own center point, and confirm the answer is the tooltip.
 */
type TooltipHitTest = {
  /** Whether the tooltip is the topmost element at its own center point */
  onTop: boolean
  /** Whatever was found at that point instead, for the failure message */
  hit: string
  /** The tooltip's parent, which shows where it is anchored in the DOM */
  parent: string
}

const hitTestTooltip = (page: Page): Promise<TooltipHitTest> =>
  page.evaluate((id) => {
    /** Render an element as a short css-ish selector for diagnostics */
    const describe = (el: Element | null): string => {
      if (!el) {
        return 'nothing'
      }
      const className = typeof el.className === 'string' ? el.className.trim() : ''
      return [
        el.tagName.toLowerCase(),
        el.id ? `#${el.id}` : '',
        className ? `.${className.split(/\s+/).join('.')}` : '',
      ].join('')
    }

    const tooltip = document.getElementById(id)

    if (!tooltip) {
      return { onTop: false, hit: 'the tooltip element is not in the DOM', parent: 'nothing' }
    }

    const { left, top, width, height } = tooltip.getBoundingClientRect()
    const found = document.elementFromPoint(left + width / 2, top + height / 2)

    return {
      onTop: Boolean(found) && (found === tooltip || tooltip.contains(found)),
      hit: describe(found),
      parent: describe(tooltip.parentElement),
    }
  }, ELEMENT_ID)

/** Hover the trigger and wait for the tooltip to actually be shown */
const openTooltip = async (page: Page) => {
  await page.getByRole('button', { name: 'Hover Me' }).hover()
  // `state: 'visible'` matters — the element is always in the DOM, just `display: none`
  await page.waitForSelector(`#${ELEMENT_ID}`, { state: 'visible' })
}

test.describe('ScalarTooltip top layer', () => {
  test.use({ component: 'ScalarTooltip', viewport: { width: 480, height: 360 }, background: true })

  test.describe('outside a dialog', () => {
    test.use({ story: 'Base' })

    // Control. If this ever fails the hit test itself is broken, not the tooltip.
    test('paints above normal page content', async ({ page }) => {
      await openTooltip(page)

      const { onTop, hit, parent } = await hitTestTooltip(page)

      expect(onTop, `expected the tooltip to be on top but found ${hit} (tooltip parent: ${parent})`).toBe(true)
    })
  })

  test.describe('inside a modal dialog', () => {
    test.use({ story: 'In Dialog' })

    test('paints above a dialog opened with showModal()', async ({ page, snapshot }) => {
      await openTooltip(page)

      const { onTop, hit, parent } = await hitTestTooltip(page)

      expect(onTop, `expected the tooltip to be on top but found ${hit} (tooltip parent: ${parent})`).toBe(true)

      // The hit test alone would pass on a completely unstyled tooltip. Every tooltip
      // style is scoped to its parent, so moving the element is only half the fix and
      // this snapshot is what covers the other half.
      await snapshot()
    })
  })

  test.describe('inside a non-modal dialog', () => {
    test.use({ story: 'In Non Modal Dialog' })

    // `show()` does not enter the top layer, so this passes with or without the fix.
    // It is here to keep the fix from reparenting a dialog that never needed it.
    test('paints above a dialog opened with show()', async ({ page }) => {
      await openTooltip(page)

      const { onTop, hit, parent } = await hitTestTooltip(page)

      expect(onTop, `expected the tooltip to be on top but found ${hit} (tooltip parent: ${parent})`).toBe(true)
    })
  })
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
