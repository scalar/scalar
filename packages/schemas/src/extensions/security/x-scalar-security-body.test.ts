import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarSecurityBody } from './x-scalar-security-body'

describe('XScalarSecurityBody', () => {
  it('allows multiple properties', () => {
    const value = {
      'x-scalar-security-body': {
        audience: 'https://api.example.com',
        resource: 'user-profile',
      },
    }

    expect(validate(XScalarSecurityBody, value)).toBe(true)
    expect(coerce(XScalarSecurityBody, value)).toEqual(value)
  })

  it('can be empty, not required', () => {
    expect(validate(XScalarSecurityBody, {})).toBe(true)
    expect(coerce(XScalarSecurityBody, {})).toEqual({})
  })
})
