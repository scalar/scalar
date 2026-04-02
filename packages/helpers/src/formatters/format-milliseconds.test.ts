import { describe, expect, it } from 'vitest'

import { formatMilliseconds } from './format-milliseconds'

describe('format-ms', () => {
  it('formats values under 1000ms as milliseconds', () => {
    expect(formatMilliseconds(0)).toBe('0ms')
    expect(formatMilliseconds(1)).toBe('1ms')
    expect(formatMilliseconds(999)).toBe('999ms')
    expect(formatMilliseconds(1000)).toBe('1000ms')
  })

  it('formats values over 1000ms as seconds with two decimal places', () => {
    expect(formatMilliseconds(1001)).toBe('1.00s')
    expect(formatMilliseconds(1500)).toBe('1.50s')
    expect(formatMilliseconds(2000)).toBe('2.00s')
    expect(formatMilliseconds(60000)).toBe('60.00s')
  })

  it('respects a custom decimal precision', () => {
    expect(formatMilliseconds(1500, 0)).toBe('2s')
    expect(formatMilliseconds(1500, 1)).toBe('1.5s')
    expect(formatMilliseconds(1500, 3)).toBe('1.500s')
  })
})
