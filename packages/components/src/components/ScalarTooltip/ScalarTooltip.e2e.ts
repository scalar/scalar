import { takeTooltipSnapshot } from '@/components/ScalarTooltip/helpers'
import { test } from '@test/helpers'

test.describe('ScalarTooltip', () => {
  test.use({ background: true, colorModes: ['light', 'dark'] })
  test('Base', takeTooltipSnapshot)
})
