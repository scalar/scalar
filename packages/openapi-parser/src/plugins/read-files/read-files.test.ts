import { describe, expect, it } from 'vitest'

import { readFiles } from './read-files'

describe('readFiles', () => {
  it('returns true for a filename', () => {
    expect(readFiles().check('openapi.yaml')).toBe(true)
  })

  it('returns true for a path', () => {
    expect(readFiles().check('../specification/openapi.yaml')).toBe(true)
  })

  it('returns false for an object', () => {
    expect(readFiles().check({})).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(readFiles().check()).toBe(false)
  })

  it('returns false for an url', () => {
    expect(readFiles().check('http://example.com/specification/openapi.yaml')).toBe(false)
  })
})
