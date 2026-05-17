import { validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XEnumDescriptions } from './x-enum-descriptions'

describe('XEnumDescriptions', () => {
  it('validates enum descriptions mapping', () => {
    expect(
      validate(XEnumDescriptions, {
        'x-enumDescriptions': {
          missing_features: 'Missing features',
          too_expensive: 'Too expensive',
          unused: 'Unused',
          other: 'Other',
        },
      }),
    ).toBe(true)
  })

  it('allows empty object', () => {
    expect(validate(XEnumDescriptions, {})).toBe(true)
  })

  it('rejects invalid value', () => {
    expect(
      validate(XEnumDescriptions, {
        'x-enumDescriptions': 'invalid',
      }),
    ).toBe(false)
  })
})
