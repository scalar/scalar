import { describe, expect, it } from 'vitest'

import { isAuthenticationRequired } from './isAuthenticationRequired'

describe('isAuthenticationRequired', () => {
  it('returns false when security is undefined', () => {
    expect(isAuthenticationRequired(undefined)).toBe(false)
  })

  it('returns false when security is an empty array', () => {
    expect(isAuthenticationRequired([])).toBe(false)
  })

  it('returns false when security includes an empty object', () => {
    expect(isAuthenticationRequired([{}])).toBe(false)
  })

  it('returns true when security is defined and not empty', () => {
    expect(isAuthenticationRequired([{ apiKey: [] }])).toBe(true)
  })

  it('returns true when security has multiple schemes', () => {
    expect(isAuthenticationRequired([{ apiKey: [] }, { oauth2: ['read', 'write'] }])).toBe(true)
  })

  it('returns false when security is an array with an empty object among non-empty objects', () => {
    expect(isAuthenticationRequired([{ apiKey: [] }, {}, { oauth2: ['read'] }])).toBe(false)
  })
})
