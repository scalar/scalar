import { describe, expect, it } from 'vitest'
import { XScalarStabilitySchema } from './x-scalar-stability'

describe('XScalarStability', () => {
  it('allows deprecated value', () => {
    const result = XScalarStabilitySchema.parse({
      'x-scalar-stability': 'deprecated',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'deprecated' })
  })

  it('allows experimental value', () => {
    const result = XScalarStabilitySchema.parse({
      'x-scalar-stability': 'experimental',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'experimental' })
  })

  it('allows stable value', () => {
    const result = XScalarStabilitySchema.parse({
      'x-scalar-stability': 'stable',
    })
    expect(result).toEqual({ 'x-scalar-stability': 'stable' })
  })

  it('defaults to undefined when empty', () => {
    const result = XScalarStabilitySchema.parse({})
    expect(result).toEqual({ 'x-scalar-stability': undefined })
  })

  it('defaults to undefined when invalid value provided', () => {
    const result = XScalarStabilitySchema.parse({
      'x-scalar-stability': 'invalid',
    })
    expect(result).toEqual({ 'x-scalar-stability': undefined })
  })
})
