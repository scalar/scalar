import { Value } from '@scalar/typebox/value'
import { describe, expect, it } from 'vitest'

import { XPostResponseSchema } from './x-post-response'

describe('x-post-response', () => {
  it('validates a valid post response script', () => {
    const result = Value.Parse(XPostResponseSchema, {
      'x-post-response': 'pm.test("Status code is 200", () => { pm.response.to.have.status(200) })',
    })

    expect(result).toEqual({
      'x-post-response': 'pm.test("Status code is 200", () => { pm.response.to.have.status(200) })',
    })
  })

  it('allows empty object', () => {
    const result = Value.Parse(XPostResponseSchema, {})
    expect(result).toEqual({ 'x-post-response': undefined })
  })

  it('coerces to string', () => {
    const result = Value.Parse(XPostResponseSchema, {
      'x-post-response': 123,
    })
    expect(result).toEqual({ 'x-post-response': '123' })
  })
})
