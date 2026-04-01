import { describe, expect, it } from 'vitest'

import { prettyBytes } from './pretty-bytes'

describe('pretty-bytes', () => {
  it('formats bytes without decimals', () => {
    expect(prettyBytes(0)).toBe('0 B')
    expect(prettyBytes(1)).toBe('1 B')
    expect(prettyBytes(999)).toBe('999 B')
  })

  it('formats kilobytes and above with one decimal', () => {
    expect(prettyBytes(1000)).toBe('1.0 kB')
    expect(prettyBytes(1500)).toBe('1.5 kB')
    expect(prettyBytes(1_000_000)).toBe('1.0 MB')
    expect(prettyBytes(1_000_000_000)).toBe('1.0 GB')
  })

  it('caps units at gigabytes', () => {
    expect(prettyBytes(1_000_000_000_000)).toBe('1000.0 GB')
  })

  it('returns 0 B for invalid and negative inputs', () => {
    expect(prettyBytes(-1)).toBe('0 B')
    expect(prettyBytes(Number.NaN)).toBe('0 B')
    expect(prettyBytes(Number.POSITIVE_INFINITY)).toBe('0 B')
  })
})
