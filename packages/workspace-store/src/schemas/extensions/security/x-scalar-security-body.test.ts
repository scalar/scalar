import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarSecurityBody } from './x-scalar-security-body'

describe('XScalarSecurityBody', () => {
  it('allows multiple properties', () => {
    const result = Value.Parse(XScalarSecurityBody, {
      'x-scalar-security-body': {
        audience: 'https://api.example.com',
        resource: 'user-profile',
      },
    })

    expect(result).toEqual({
      'x-scalar-security-body': {
        audience: 'https://api.example.com',
        resource: 'user-profile',
      },
    })
  })

  it('can be empty, not required', () => {
    const result = Value.Parse(XScalarSecurityBody, {})

    expect(result).toEqual({})
  })
})
