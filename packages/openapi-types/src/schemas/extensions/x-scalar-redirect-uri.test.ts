import { describe, expect, it } from 'vitest'
import { XScalarRedirectUriSchema } from './x-scalar-redirect-uri'

describe('XScalarRedirectUri', () => {
  it('accepts a valid URI string', () => {
    const result = XScalarRedirectUriSchema.parse({
      'x-scalar-redirect-uri': 'https://example.com/callback',
    })
    expect(result).toEqual({
      'x-scalar-redirect-uri': 'https://example.com/callback',
    })
  })

  it('accepts an empty string', () => {
    const result = XScalarRedirectUriSchema.parse({
      'x-scalar-redirect-uri': '',
    })
    expect(result).toEqual({ 'x-scalar-redirect-uri': '' })
  })

  it('defaults to undefined when empty object provided', () => {
    const result = XScalarRedirectUriSchema.parse({})
    expect(result).toEqual({ 'x-scalar-redirect-uri': undefined })
  })
})
