import { describe, expect, it } from 'vitest'

import { isRelativePath } from './is-relative-path'

describe('isRelativePath', () => {
  it('returns true for relative paths starting with a slash', () => {
    expect(isRelativePath('/api')).toBe(true)
  })

  it('returns true for relative paths without a slash', () => {
    expect(isRelativePath('api')).toBe(true)
  })

  it('returns false for absolute URLs with http', () => {
    expect(isRelativePath('http://example.com')).toBe(false)
  })

  it('returns false for absolute URLs with https', () => {
    expect(isRelativePath('https://example.com')).toBe(false)
  })

  it('returns false for domain-like URLs without protocol', () => {
    expect(isRelativePath('example.com/api')).toBe(false)
  })
})
