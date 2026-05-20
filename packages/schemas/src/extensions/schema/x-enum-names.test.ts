import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XEnumVarNames } from './x-enum-varnames'

describe('XEnumVarNames', () => {
  it('validates x-enum-varnames array', () => {
    const value = { 'x-enum-varnames': ['Moon', 'Asteroid', 'Comet'] }
    expect(validate(XEnumVarNames, value)).toBe(true)
    expect(coerce(XEnumVarNames, value)).toEqual(value)
  })

  it('validates x-enumNames array (alternative format)', () => {
    const value = { 'x-enumNames': ['Active', 'Inactive', 'Pending'] }
    expect(validate(XEnumVarNames, value)).toBe(true)
    expect(coerce(XEnumVarNames, value)).toEqual(value)
  })

  it('allows empty object when no enum names provided', () => {
    expect(validate(XEnumVarNames, {})).toBe(true)
    expect(coerce(XEnumVarNames, {})).toEqual({})
  })

  it('validates both x-enum-varnames and x-enumNames together', () => {
    const value = {
      'x-enum-varnames': ['Primary', 'Secondary'],
      'x-enumNames': ['Success', 'Error'],
    }
    expect(validate(XEnumVarNames, value)).toBe(true)
    expect(coerce(XEnumVarNames, value)).toEqual(value)
  })

  it('rejects invalid value', () => {
    expect(
      validate(XEnumVarNames, {
        'x-enum-varnames': 'invalid-string-instead-of-array',
      }),
    ).toBe(false)

    expect(
      validate(XEnumVarNames, {
        'x-enumNames': ['valid', 123],
      }),
    ).toBe(false)
  })
})
