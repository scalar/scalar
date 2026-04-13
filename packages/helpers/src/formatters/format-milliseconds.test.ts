import { describe, expect, it } from 'vitest'

import { formatMilliseconds } from './format-milliseconds'

describe('formatMilliseconds', () => {
  it('formats values at or under 1000ms as milliseconds with two decimal places', () => {
    expect(formatMilliseconds(0)).toBe('0.00ms')
    expect(formatMilliseconds(1)).toBe('1.00ms')
    expect(formatMilliseconds(500)).toBe('500.00ms')
    expect(formatMilliseconds(999)).toBe('999.00ms')
    expect(formatMilliseconds(1000)).toBe('1000.00ms')
  })

  it('formats fractional milliseconds with two decimal places', () => {
    expect(formatMilliseconds(0.5)).toBe('0.50ms')
    expect(formatMilliseconds(1.234)).toBe('1.23ms')
    expect(formatMilliseconds(99.999)).toBe('100.00ms')
  })

  it('formats values over 1000ms as seconds with two decimal places', () => {
    expect(formatMilliseconds(1001)).toBe('1.00s')
    expect(formatMilliseconds(1500)).toBe('1.50s')
    expect(formatMilliseconds(2000)).toBe('2.00s')
    expect(formatMilliseconds(60000)).toBe('60.00s')
  })

  it('respects a custom decimal precision for seconds', () => {
    expect(formatMilliseconds(1500, 0)).toBe('2s')
    expect(formatMilliseconds(1500, 1)).toBe('1.5s')
    expect(formatMilliseconds(1500, 3)).toBe('1.500s')
  })
})
