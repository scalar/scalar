import { describe, expect, it } from 'vitest'

import { formatBytes } from './format-bytes'

describe('format-bytes', () => {
  it('formats bytes without unnecessary decimals', () => {
    expect(formatBytes(0)).toBe('0 B')
    expect(formatBytes(1)).toBe('1 B')
    expect(formatBytes(999)).toBe('999 B')
  })

  it('formats values with three significant digits', () => {
    expect(formatBytes(1000)).toBe('1 kB')
    expect(formatBytes(1500)).toBe('1.5 kB')
    expect(formatBytes(1024)).toBe('1.02 kB')
    expect(formatBytes(2048)).toBe('2.05 kB')
    expect(formatBytes(1_000_000)).toBe('1 MB')
    expect(formatBytes(1_000_000_000)).toBe('1 GB')
  })

  it('advances to the next unit when rounding reaches 1000', () => {
    expect(formatBytes(999_500)).toBe('1 MB')
    expect(formatBytes(999_499_999)).toBe('999 MB')
    expect(formatBytes(999_500_000)).toBe('1 GB')
  })

  it('supports large units beyond gigabytes', () => {
    expect(formatBytes(9_999_999_999_999)).toBe('10 TB')
    expect(formatBytes(9_007_199_254_740_991)).toBe('9.01 PB')
  })

  it('returns 0 B for invalid and negative inputs', () => {
    expect(formatBytes(-1)).toBe('0 B')
    expect(formatBytes(Number.NaN)).toBe('0 B')
    expect(formatBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
  })
})
