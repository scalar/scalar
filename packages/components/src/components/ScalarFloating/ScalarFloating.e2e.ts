import { placements } from '@floating-ui/utils'
import { test } from '@test/helpers'

test.describe('ScalarFloating', () => {
  test.use({ component: 'ScalarFloating' })

  test.describe('Placements', () =>
    placements.forEach((placement) =>
      test.describe(() => {
        test.use({ story: 'Base', args: { placement: placement } })
        test(placement, async ({ snapshot }) => await snapshot(`placement-${placement}`))
      }),
    ))

  test.describe('Resizing', () =>
    ['bottom', 'right'].forEach((placement) =>
      test.describe(() => {
        // Make sure we resize both horizontally and vertically
        test.use({ story: 'resize', args: { placement: placement } })
        test(placement, async ({ snapshot }) => await snapshot(`placement-${placement}`))
      }),
    ))

  test.describe('Max Size', () =>
    ['bottom', 'right'].forEach((placement) =>
      test.describe(() => {
        // Set the viewport so that the floating element is constrained
        test.use({ story: 'base', args: { placement: placement }, viewport: { width: 240, height: 120 } })
        test(placement, async ({ snapshot }) => await snapshot(`max-size-${placement}`))
      }),
    ))
})
