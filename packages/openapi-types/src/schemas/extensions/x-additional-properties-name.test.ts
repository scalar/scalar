import { describe, expect, it } from 'vitest'
import { XAdditionalPropertiesNameSchema } from './x-additional-properties-name'

describe('XAdditionalPropertiesNameSchema', () => {
  it('accepts a valid additional properties name', () => {
    const result = XAdditionalPropertiesNameSchema.parse({
      'x-additionalPropertiesName': 'customField',
    })

    expect(result).toEqual({
      'x-additionalPropertiesName': 'customField',
    })
  })

  it('defaults to undefined when empty', () => {
    const result = XAdditionalPropertiesNameSchema.parse({})
    expect(result).toEqual({
      'x-additionalPropertiesName': undefined,
    })
  })

  it('defaults to undefined when invalid type is provided', () => {
    const result = XAdditionalPropertiesNameSchema.parse({
      'x-additionalPropertiesName': 123, // Invalid type - should be string
    })
    expect(result).toEqual({
      'x-additionalPropertiesName': undefined,
    })
  })
})
