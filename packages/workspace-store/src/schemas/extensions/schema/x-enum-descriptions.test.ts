import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XEnumDescriptionsSchema } from './x-enum-descriptions'

describe('XEnumDescriptionsSchema', () => {
  it('validates enum descriptions mapping', () => {
    const result = Value.Parse(XEnumDescriptionsSchema, {
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

  it('defaults to undefined when empty', () => {
    expect(Value.Parse(XEnumDescriptionsSchema, {})).toEqual({
      'x-enumDescriptions': undefined,
    })
  })

  it('throws error when invalid value provided', () => {
    const result = Value.Check(XEnumDescriptionsSchema, {
      'x-enumDescriptions': 'invalid',
    })
    expect(result).toEqual(false)
  })
})
