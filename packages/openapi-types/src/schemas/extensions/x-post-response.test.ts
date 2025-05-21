import { describe, expect, it } from 'vitest'
import { XPostResponseSchema } from './x-post-response'

describe('x-post-response', () => {
  it('validates a valid post response script', () => {
    const result = XPostResponseSchema.parse({
      'x-post-response': 'pm.test("Status code is 200", () => { pm.response.to.have.status(200) })',
    })

    expect(result).toEqual({
      'x-post-response': 'pm.test("Status code is 200", () => { pm.response.to.have.status(200) })',
    })
  })

  it('allows empty object', () => {
    const result = XPostResponseSchema.parse({})
    expect(result).toEqual({ 'x-post-response': undefined })
  })

  it('rejects non-string values', () => {
    expect(() =>
      XPostResponseSchema.parse({
        'x-post-response': 123,
      }),
    ).toThrow()
  })
})
