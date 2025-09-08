import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarSecurityQuery } from './x-scalar-security-query'

describe('XScalarSecurityQuery', () => {
  it('allows any property', () => {
    const result = Value.Parse(XScalarSecurityQuery, {
      'x-scalar-security-query': {
        prompt: 'consent',
      },
    })

    expect(result).toEqual({
      'x-scalar-security-query': {
        prompt: 'consent',
      },
    })
  })

  it('allows more than one property', () => {
    const result = Value.Parse(XScalarSecurityQuery, {
      'x-scalar-security-query': {
        prompt: 'consent',
        audience: 'scalar',
      },
    })

    expect(result).toEqual({
      'x-scalar-security-query': {
        prompt: 'consent',
        audience: 'scalar',
      },
    })
  })

  it('can be empty, not required', () => {
    const result = Value.Parse(XScalarSecurityQuery, {})

    expect(result).toEqual({})
  })
})
