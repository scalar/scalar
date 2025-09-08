import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XDisplayNameSchema } from './x-display-name'

describe('XDisplayName', () => {
  it('allows string value', () => {
    const result = Value.Parse(XDisplayNameSchema, {
      'x-displayName': 'User Profile',
    })
    expect(result).toEqual({ 'x-displayName': 'User Profile' })
  })

  it('allows empty string', () => {
    const result = Value.Parse(XDisplayNameSchema, {
      'x-displayName': '',
    })
    expect(result).toEqual({ 'x-displayName': '' })
  })

  it('defaults to undefined when empty object', () => {
    const result = Value.Parse(XDisplayNameSchema, {})
    expect(result).toEqual({ 'x-displayName': undefined })
  })

  it('coerces to string when invalid value provided', () => {
    const result = Value.Parse(XDisplayNameSchema, {
      'x-displayName': 123,
    })
    expect(result).toEqual({ 'x-displayName': '123' })
  })
})
