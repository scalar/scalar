import { describe, expect, it } from 'vitest'

import { formatMilliseconds } from './format-milliseconds'

describe('formatMilliseconds', () => {
  describe('milliseconds (under 1 second)', () => {
    it('formats 0ms correctly', () => {
      expect(formatMilliseconds(0)).toBe('0ms')
    })

    it('formats small millisecond values', () => {
      expect(formatMilliseconds(1)).toBe('1ms')
      expect(formatMilliseconds(50)).toBe('50ms')
      expect(formatMilliseconds(999)).toBe('999ms')
    })

    it('formats exactly 1000ms as milliseconds', () => {
      expect(formatMilliseconds(1000)).toBe('1000ms')
    })

    it('handles decimal millisecond values', () => {
      expect(formatMilliseconds(0.5)).toBe('0.5ms')
      expect(formatMilliseconds(123.456)).toBe('123.456ms')
    })
  })

  describe('seconds (over 1 second)', () => {
    it('formats values just over 1 second', () => {
      expect(formatMilliseconds(1001)).toBe('1.00s')
      expect(formatMilliseconds(1500)).toBe('1.50s')
    })

    it('formats multi-second values with default 2 decimals', () => {
      expect(formatMilliseconds(2500)).toBe('2.50s')
      expect(formatMilliseconds(5000)).toBe('5.00s')
      expect(formatMilliseconds(10000)).toBe('10.00s')
    })

    it('formats large values correctly', () => {
      expect(formatMilliseconds(60000)).toBe('60.00s')
      expect(formatMilliseconds(123456)).toBe('123.46s')
    })

    it('rounds decimals correctly', () => {
      expect(formatMilliseconds(1234)).toBe('1.23s')
      expect(formatMilliseconds(1235)).toBe('1.24s')
      expect(formatMilliseconds(1999)).toBe('2.00s')
    })
  })

  describe('custom decimal precision', () => {
    it('formats with 0 decimals', () => {
      expect(formatMilliseconds(1500, 0)).toBe('2s')
      expect(formatMilliseconds(2499, 0)).toBe('2s')
      expect(formatMilliseconds(2500, 0)).toBe('3s')
    })

    it('formats with 1 decimal', () => {
      expect(formatMilliseconds(1234, 1)).toBe('1.2s')
      expect(formatMilliseconds(5678, 1)).toBe('5.7s')
    })

    it('formats with 3 decimals', () => {
      expect(formatMilliseconds(1234, 3)).toBe('1.234s')
      expect(formatMilliseconds(5678, 3)).toBe('5.678s')
    })

    it('formats with 4 decimals', () => {
      expect(formatMilliseconds(12345, 4)).toBe('12.3450s')
    })
  })

  describe('edge cases', () => {
    it('handles negative values', () => {
      expect(formatMilliseconds(-500)).toBe('-500ms')
      expect(formatMilliseconds(-1500)).toBe('-1.50s')
    })

    it('handles very large values', () => {
      expect(formatMilliseconds(1000000)).toBe('1000.00s')
      expect(formatMilliseconds(3600000)).toBe('3600.00s')
    })

    it('handles very small decimal values', () => {
      expect(formatMilliseconds(0.001)).toBe('0.001ms')
      expect(formatMilliseconds(0.1)).toBe('0.1ms')
    })
  })
})
