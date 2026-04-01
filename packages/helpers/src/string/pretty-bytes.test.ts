import { describe, expect, it } from 'vitest'

import { prettyBytes } from './pretty-bytes'

describe('pretty-bytes', () => {
  it('formats bytes without unnecessary decimals', () => {
    expect(prettyBytes(0)).toBe('0 B')
    expect(prettyBytes(1)).toBe('1 B')
    expect(prettyBytes(999)).toBe('999 B')
  })

  it('formats values with three significant digits', () => {
    expect(prettyBytes(1000)).toBe('1 kB')
    expect(prettyBytes(1500)).toBe('1.5 kB')
    expect(prettyBytes(1024)).toBe('1.02 kB')
    expect(prettyBytes(2048)).toBe('2.05 kB')
    expect(prettyBytes(1_000_000)).toBe('1 MB')
    expect(prettyBytes(1_000_000_000)).toBe('1 GB')
  })

  it('supports large units beyond gigabytes', () => {
    expect(prettyBytes(9_999_999_999_999)).toBe('10 TB')
    expect(prettyBytes(9_007_199_254_740_991)).toBe('9.01 PB')
  })

  it('returns 0 B for invalid and negative inputs', () => {
    expect(prettyBytes(-1)).toBe('0 B')
    expect(prettyBytes(Number.NaN)).toBe('0 B')
    expect(prettyBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
  })
})
