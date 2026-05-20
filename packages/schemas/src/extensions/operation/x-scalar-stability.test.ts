import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarStability } from './x-scalar-stability'

describe('XScalarStability', () => {
  it('allows deprecated value', () => {
    expect(validate(XScalarStability, { 'x-scalar-stability': 'deprecated' })).toBe(true)
    expect(coerce(XScalarStability, { 'x-scalar-stability': 'deprecated' })).toEqual({
      'x-scalar-stability': 'deprecated',
    })
  })

  it('allows experimental value', () => {
    expect(validate(XScalarStability, { 'x-scalar-stability': 'experimental' })).toBe(true)
    expect(coerce(XScalarStability, { 'x-scalar-stability': 'experimental' })).toEqual({
      'x-scalar-stability': 'experimental',
    })
  })

  it('allows stable value', () => {
    expect(validate(XScalarStability, { 'x-scalar-stability': 'stable' })).toBe(true)
    expect(coerce(XScalarStability, { 'x-scalar-stability': 'stable' })).toEqual({
      'x-scalar-stability': 'stable',
    })
  })

  it('allows empty object', () => {
    expect(validate(XScalarStability, {})).toBe(true)
    expect(coerce(XScalarStability, {})).toEqual({})
  })

  it('rejects invalid value', () => {
    expect(validate(XScalarStability, { 'x-scalar-stability': 'invalid' })).toBe(false)
  })
})
