import { describe, expect, it } from 'vitest'
import { XEnumVarNamesSchema } from './x-enum-varnames'
import { Value } from '@scalar/typebox/value'

describe('XEnumVarNamesSchema', () => {
  it('validates x-enum-varnames array', () => {
    const result = Value.Parse(XEnumVarNamesSchema, {
      'x-enum-varnames': ['Moon', 'Asteroid', 'Comet'],
    })

    expect(result).toEqual({
      'x-enum-varnames': ['Moon', 'Asteroid', 'Comet'],
    })
  })

  it('validates x-enumNames array (alternative format)', () => {
    const result = Value.Parse(XEnumVarNamesSchema, {
      'x-enumNames': ['Active', 'Inactive', 'Pending'],
    })

    expect(result).toEqual({
      'x-enumNames': ['Active', 'Inactive', 'Pending'],
    })
  })

  it('allows empty object when no enum names provided', () => {
    const result = Value.Parse(XEnumVarNamesSchema, {})

    expect(result).toEqual({})
  })

  it('validates both x-enum-varnames and x-enumNames together', () => {
    const result = Value.Parse(XEnumVarNamesSchema, {
      'x-enum-varnames': ['Primary', 'Secondary'],
      'x-enumNames': ['Success', 'Error'],
    })

    expect(result).toEqual({
      'x-enum-varnames': ['Primary', 'Secondary'],
      'x-enumNames': ['Success', 'Error'],
    })
  })

  it('throws error when invalid value provided', () => {
    const result = Value.Check(XEnumVarNamesSchema, {
      'x-enum-varnames': 'invalid-string-instead-of-array',
    })
    expect(result).toBe(false)

    const result2 = Value.Check(XEnumVarNamesSchema, {
      'x-enumNames': ['valid', 123], // number in array should fail
    })
    expect(result2).toBe(false)
  })
})
