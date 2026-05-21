import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XScalarCredentialsLocation } from './x-scalar-credentials-location'

describe('XScalarCredentialsLocation', () => {
  it('allows header value', () => {
    expect(validate(XScalarCredentialsLocation, { 'x-scalar-credentials-location': 'header' })).toBe(true)
    expect(coerce(XScalarCredentialsLocation, { 'x-scalar-credentials-location': 'header' })).toEqual({
      'x-scalar-credentials-location': 'header',
    })
  })

  it('allows body value', () => {
    expect(validate(XScalarCredentialsLocation, { 'x-scalar-credentials-location': 'body' })).toBe(true)
    expect(coerce(XScalarCredentialsLocation, { 'x-scalar-credentials-location': 'body' })).toEqual({
      'x-scalar-credentials-location': 'body',
    })
  })
})
