import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XAdditionalPropertiesName } from './x-additional-properties-name'

describe('XAdditionalPropertiesName', () => {
  it('accepts a valid additional properties name', () => {
    expect(
      validate(XAdditionalPropertiesName, {
        'x-additionalPropertiesName': 'customField',
      }),
    ).toBe(true)
    expect(
      coerce(XAdditionalPropertiesName, {
        'x-additionalPropertiesName': 'customField',
      }),
    ).toEqual({
      'x-additionalPropertiesName': 'customField',
    })
  })

  it('allows empty object', () => {
    expect(validate(XAdditionalPropertiesName, {})).toBe(true)
    expect(coerce(XAdditionalPropertiesName, {})).toEqual({})
  })

  it('coerces invalid values to empty string', () => {
    expect(
      coerce(XAdditionalPropertiesName, {
        'x-additionalPropertiesName': 123,
      }),
    ).toEqual({
      'x-additionalPropertiesName': '',
    })
  })
})
