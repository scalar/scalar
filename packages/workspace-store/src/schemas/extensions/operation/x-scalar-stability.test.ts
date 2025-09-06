import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarStabilitySchema } from './x-scalar-stability'

describe('XScalarStability', () => {
  it('allows deprecated value', () => {
    const result = Value.Parse(XScalarStabilitySchema, {
      'x-scalar-stability': 'deprecated',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'deprecated' })
  })

  it('allows experimental value', () => {
    const result = Value.Parse(XScalarStabilitySchema, {
      'x-scalar-stability': 'experimental',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'experimental' })
  })

  it('allows stable value', () => {
    const result = Value.Parse(XScalarStabilitySchema, {
      'x-scalar-stability': 'stable',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'stable' })
  })

  it('defaults to undefined when empty', () => {
    const result = Value.Parse(XScalarStabilitySchema, {})
    expect(result).toEqual({ 'x-scalar-stability': undefined })
  })

  it('throws when invalid value provided', () => {
    expect(() =>
      Value.Parse(XScalarStabilitySchema, {
        'x-scalar-stability': 'invalid',
      }),
    ).toThrow()
  })
})
