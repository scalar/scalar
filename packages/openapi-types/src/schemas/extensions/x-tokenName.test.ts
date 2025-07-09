import { describe, expect, it } from 'vitest'
import { XTokenName } from './x-tokenName'

describe('XTokenName', () => {
  it('allows string value', () => {
    const result = XTokenName.parse({
      'x-tokenName': 'custom_access_token',
    })

    expect(result).toEqual({
      'x-tokenName': 'custom_access_token',
    })
  })

  it('allows different token names', () => {
    const result = XTokenName.parse({
      'x-tokenName': 'bearer_token',
    })

    expect(result).toEqual({
      'x-tokenName': 'bearer_token',
    })
  })

  it('can be empty, not required', () => {
    const result = XTokenName.parse({})

    expect(result).toEqual({})
  })

  it('rejects non-string values', () => {
    expect(() => {
      XTokenName.parse({
        'x-tokenName': 123,
      })
    }).toThrow()
  })
})
