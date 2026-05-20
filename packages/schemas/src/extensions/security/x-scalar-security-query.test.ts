import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarSecurityQuery } from './x-scalar-security-query'

describe('XScalarSecurityQuery', () => {
  it('allows any property', () => {
    const value = {
      'x-scalar-security-query': {
        prompt: 'consent',
      },
    }

    expect(validate(XScalarSecurityQuery, value)).toBe(true)
    expect(coerce(XScalarSecurityQuery, value)).toEqual(value)
  })

  it('allows more than one property', () => {
    const value = {
      'x-scalar-security-query': {
        prompt: 'consent',
        audience: 'scalar',
      },
    }

    expect(validate(XScalarSecurityQuery, value)).toBe(true)
    expect(coerce(XScalarSecurityQuery, value)).toEqual(value)
  })

  it('can be empty, not required', () => {
    expect(validate(XScalarSecurityQuery, {})).toBe(true)
    expect(coerce(XScalarSecurityQuery, {})).toEqual({})
  })
})
