import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { XScalarRedirectUriSchema } from './x-scalar-redirect-uri'

describe('XScalarRedirectUri', () => {
  it('accepts a valid URI string', () => {
    const result = Value.Parse(XScalarRedirectUriSchema, {
      'x-scalar-redirect-uri': 'https://example.com/callback',
    })
    expect(result).toEqual({
      'x-scalar-redirect-uri': 'https://example.com/callback',
    })
  })

  it('accepts an empty string', () => {
    const result = Value.Parse(XScalarRedirectUriSchema, {
      'x-scalar-redirect-uri': '',
    })
    expect(result).toEqual({ 'x-scalar-redirect-uri': '' })
  })

  it('defaults to empty string when empty object provided', () => {
    const result = coerceValue(XScalarRedirectUriSchema, {})
    expect(result).toEqual({ 'x-scalar-redirect-uri': '' })
  })
})
