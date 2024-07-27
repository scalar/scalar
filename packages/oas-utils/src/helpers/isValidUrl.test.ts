import { describe, expect, it } from 'vitest'

import { isValidUrl } from './isValidUrl'

describe('isValidUrl ', () => {
  it('says false for empty string', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('says false for a path', () => {
    expect(isValidUrl('/some-path')).toBe(false)
  })

  it('says false for a origin without a protocol', () => {
    expect(isValidUrl('google.com')).toBe(false)
  })

  it('says true for a protocol, origin, host, path and query parameters', () => {
    expect(isValidUrl('https://google.com/maps?some=thing')).toBe(true)
  })
})
