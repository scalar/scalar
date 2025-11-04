import { describe, expect, it } from 'vitest'

import { truncate } from './truncate'

describe('truncate', () => {
  it('should truncate strings longer than maxLength', () => {
    expect(truncate('Very long name that needs truncation')).toBe('Very long name th…')
    expect(truncate('This is a very long string', 10)).toBe('This is a …')
  })

  it('should not truncate strings shorter than maxLength', () => {
    expect(truncate('Short')).toBe('Short')
    expect(truncate('Exactly eighteen!!', 18)).toBe('Exactly eighteen!!')
  })

  it('should use default maxLength of 18', () => {
    expect(truncate('This is exactly 18!!')).toBe('This is exactly 18!!')
    expect(truncate('This is longer than 18 chars')).toBe('This is longer th…')
  })

  it('should handle empty strings', () => {
    expect(truncate('')).toBe('')
  })

  it('should handle edge cases', () => {
    expect(truncate('a', 1)).toBe('a')
    expect(truncate('ab', 1)).toBe('a…')
    expect(truncate('abc', 2)).toBe('ab…')
  })
})
