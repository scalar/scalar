import { describe, expect, it } from 'vitest'

import { getVisibleTabCount } from './visible-tab-count'

describe('getVisibleTabCount', () => {
  it('shows everything before the width is measured', () => {
    expect(getVisibleTabCount([100, 100, 100], 0, 50)).toBe(3)
  })

  it('shows everything when all tabs fit', () => {
    expect(getVisibleTabCount([100, 100, 100], 400, 50)).toBe(3)
  })

  it('reserves room for the More trigger when tabs overflow', () => {
    // 250 available: 100 + 100 fits without More (200), but the third overflows.
    // With the 50px More trigger reserved only the first two fit (200 <= 200).
    expect(getVisibleTabCount([100, 100, 100], 250, 50)).toBe(2)
  })

  it('keeps at least one tab visible', () => {
    expect(getVisibleTabCount([100, 100, 100], 30, 50)).toBe(1)
  })

  it('returns zero for an empty list', () => {
    expect(getVisibleTabCount([], 400, 50)).toBe(0)
  })
})
