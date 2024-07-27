import { describe, expect, it } from 'vitest'

import { isValidUrl } from './isValidUrl'

describe('isValidUrl', () => {
  it('is a valid url', () => {
    expect(isValidUrl('galaxy.scalar.com')).toBe(true)
  })

  it('is an invalid empty url', () => {
    expect(isValidUrl('')).toBe(false)
  })

  it('is an invalid url', () => {
    expect(isValidUrl('marc is a human but not valid . domain')).toBe(false)
  })
})
