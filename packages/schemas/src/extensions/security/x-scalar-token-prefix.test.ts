import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarTokenPrefix } from './x-scalar-token-prefix'

describe('x-scalar-token-prefix', () => {
  it('accepts an optional string prefix and preserves explicit disabling', () => {
    for (const value of [{}, { 'x-scalar-token-prefix': 'token' }, { 'x-scalar-token-prefix': '' }]) {
      expect(validate(XScalarTokenPrefix, value)).toBe(true)
      expect(coerce(XScalarTokenPrefix, value)).toStrictEqual(value)
    }
    expect(validate(XScalarTokenPrefix, { 'x-scalar-token-prefix': 123 })).toBe(false)
  })
})
