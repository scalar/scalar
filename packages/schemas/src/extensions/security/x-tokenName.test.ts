import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XTokenName } from './x-tokenName'

describe('XTokenName', () => {
  it('allows string value', () => {
    expect(validate(XTokenName, { 'x-tokenName': 'custom_access_token' })).toBe(true)
    expect(coerce(XTokenName, { 'x-tokenName': 'custom_access_token' })).toEqual({
      'x-tokenName': 'custom_access_token',
    })
  })

  it('allows different token names', () => {
    expect(validate(XTokenName, { 'x-tokenName': 'bearer_token' })).toBe(true)
    expect(coerce(XTokenName, { 'x-tokenName': 'bearer_token' })).toEqual({
      'x-tokenName': 'bearer_token',
    })
  })

  it('can be empty, not required', () => {
    expect(validate(XTokenName, {})).toBe(true)
    expect(coerce(XTokenName, {})).toEqual({})
  })

  it('coerces invalid values to empty string', () => {
    expect(coerce(XTokenName, { 'x-tokenName': 123 })).toEqual({
      'x-tokenName': '',
    })
  })
})
