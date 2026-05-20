import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XDisplayName } from './x-display-name'

describe('XDisplayName', () => {
  it('allows string value', () => {
    expect(validate(XDisplayName, { 'x-displayName': 'User Profile' })).toBe(true)
    expect(coerce(XDisplayName, { 'x-displayName': 'User Profile' })).toEqual({
      'x-displayName': 'User Profile',
    })
  })

  it('allows empty string', () => {
    expect(validate(XDisplayName, { 'x-displayName': '' })).toBe(true)
    expect(coerce(XDisplayName, { 'x-displayName': '' })).toEqual({ 'x-displayName': '' })
  })

  it('allows empty object', () => {
    expect(validate(XDisplayName, {})).toBe(true)
    expect(coerce(XDisplayName, {})).toEqual({})
  })

  it('coerces invalid values to empty string', () => {
    expect(coerce(XDisplayName, { 'x-displayName': 123 })).toEqual({ 'x-displayName': '' })
  })
})
