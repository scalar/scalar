import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XTokenName } from './x-tokenName'

describe('XTokenName', () => {
  it('allows string value', () => {
    const result = Value.Parse(XTokenName, {
      'x-tokenName': 'custom_access_token',
    })

    expect(result).toEqual({
      'x-tokenName': 'custom_access_token',
    })
  })

  it('allows different token names', () => {
    const result = Value.Parse(XTokenName, {
      'x-tokenName': 'bearer_token',
    })

    expect(result).toEqual({
      'x-tokenName': 'bearer_token',
    })
  })

  it('can be empty, not required', () => {
    const result = Value.Parse(XTokenName, {})

    expect(result).toEqual({})
  })

  it('coerces non-string values', () => {
    const result = Value.Parse(XTokenName, {
      'x-tokenName': 123,
    })

    expect(result).toEqual({
      'x-tokenName': '123',
    })
  })
})
