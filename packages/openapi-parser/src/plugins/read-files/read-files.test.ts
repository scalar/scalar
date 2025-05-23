import { describe, expect, it } from 'vitest'

import { readFiles } from './read-files'

describe('readFiles', async () => {
  it('returns true for a filename', async () => {
    expect(readFiles().check('openapi.yaml')).toBe(true)
  })

  it('returns true for a path', async () => {
    expect(readFiles().check('../specification/openapi.yaml')).toBe(true)
  })

  it('returns false for an object', async () => {
    expect(readFiles().check({})).toBe(false)
  })

  it('returns false for undefinded', async () => {
    expect(readFiles().check()).toBe(false)
  })

  it('returns false for an url', async () => {
    expect(readFiles().check('http://example.com/specification/openapi.yaml')).toBe(false)
  })
})
