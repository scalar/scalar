import { coerce, validate } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { XPostResponse } from '../general/x-post-response'

describe('x-post-response', () => {
  it('validates a valid post response script', () => {
    const value = {
      'x-post-response': 'pm.test("Status code is 200", () => { pm.response.to.have.status(200) })',
    }
    expect(validate(XPostResponse, value)).toBe(true)
    expect(coerce(XPostResponse, value)).toEqual(value)
  })

  it('allows empty object', () => {
    expect(validate(XPostResponse, {})).toBe(true)
    expect(coerce(XPostResponse, {})).toEqual({})
  })

  it('coerces invalid values to empty string', () => {
    expect(coerce(XPostResponse, { 'x-post-response': 123 })).toEqual({ 'x-post-response': '' })
  })
})
