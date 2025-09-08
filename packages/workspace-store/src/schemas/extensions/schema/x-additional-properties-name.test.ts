import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XAdditionalPropertiesNameSchema } from './x-additional-properties-name'

describe('XAdditionalPropertiesNameSchema', () => {
  it('accepts a valid additional properties name', () => {
    const result = Value.Parse(XAdditionalPropertiesNameSchema, {
      'x-additionalPropertiesName': 'customField',
    })

    expect(result).toEqual({
      'x-additionalPropertiesName': 'customField',
    })
  })

  it('defaults to undefined when empty', () => {
    const result = Value.Parse(XAdditionalPropertiesNameSchema, {})
    expect(result).toEqual({
      'x-additionalPropertiesName': undefined,
    })
  })

  it('coerces to string', () => {
    const result = Value.Parse(XAdditionalPropertiesNameSchema, {
      'x-additionalPropertiesName': 123,
    })
    expect(result).toEqual({
      'x-additionalPropertiesName': '123',
    })
  })
})
