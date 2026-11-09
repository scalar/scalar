import { Value } from '@scalar/typebox/value'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarCredentialPlaceholders, XScalarCredentialPlaceholdersSchema } from './x-scalar-credential-placeholders'

describe('x-scalar-credential-placeholders', () => {
  it('preserves explicit fields and masking through both schema paths', () => {
    const input = {
      'x-scalar-credential-placeholders': { apiKey: { field: 'token' }, id: { field: 'username', mask: false } },
    }
    expect(Value.Parse(XScalarCredentialPlaceholdersSchema, input)).toStrictEqual(input)
    expect(coerce(XScalarCredentialPlaceholders, input)).toStrictEqual(input)
  })

  it('rejects arbitrary credential field paths', () => {
    expect(
      Value.Check(XScalarCredentialPlaceholdersSchema, {
        'x-scalar-credential-placeholders': {
          key: { field: '__proto__' },
        },
      }),
    ).toBe(false)
  })
})
