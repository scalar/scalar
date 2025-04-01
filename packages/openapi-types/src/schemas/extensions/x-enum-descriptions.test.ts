import { describe, expect, it } from 'vitest'
import { XEnumDescriptionsSchema } from './x-enum-descriptions'

describe('XEnumDescriptionsSchema', () => {
  it('validates enum descriptions mapping', () => {
    const result = XEnumDescriptionsSchema.parse({
      'x-enumDescriptions': {
        missing_features: 'Missing features',
        too_expensive: 'Too expensive',
        unused: 'Unused',
        other: 'Other',
      },
    })

    expect(result).toEqual({
      'x-enumDescriptions': {
        missing_features: 'Missing features',
        too_expensive: 'Too expensive',
        unused: 'Unused',
        other: 'Other',
      },
    })
  })

  it('defaults to empty object when empty', () => {
    expect(XEnumDescriptionsSchema.parse({})).toEqual({
      'x-enumDescriptions': {},
    })
  })

  it('defaults to empty object when invalid', () => {
    const result = XEnumDescriptionsSchema.parse({
      'x-enumDescriptions': 'invalid',
    })

    expect(result).toEqual({
      'x-enumDescriptions': {},
    })
  })
})
