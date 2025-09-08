import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XScalarCredentialsLocationSchema } from './x-scalar-credentials-location'

describe('XScalarCredentialsLocationSchema', () => {
  it('allows header value', () => {
    const result = Value.Parse(XScalarCredentialsLocationSchema, {
      'x-scalar-credentials-location': 'header',
    })
    expect(result).toEqual({ 'x-scalar-credentials-location': 'header' })
  })

  it('allows body value', () => {
    const result = Value.Parse(XScalarCredentialsLocationSchema, {
      'x-scalar-credentials-location': 'body',
    })
    expect(result).toEqual({ 'x-scalar-credentials-location': 'body' })
  })
})
