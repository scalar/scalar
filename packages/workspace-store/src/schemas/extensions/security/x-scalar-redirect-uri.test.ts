import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

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

  it('defaults to undefined when empty object provided', () => {
    const result = Value.Parse(XScalarRedirectUriSchema, {})
    expect(result).toEqual({ 'x-scalar-redirect-uri': undefined })
  })
})
