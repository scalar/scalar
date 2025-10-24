import { describe, expect, it } from 'vitest'

import { validate } from '../../../../../src/index'
import openapi1 from './openapi1.json'
import openapi2 from './openapi2.json'
import openapi3 from './openapi3.json'

describe('event-backend', () => {
  it('openapi1', async () => {
    const result = await validate(openapi1)

    // There are 682 total validation errors in this file, this may not be an effective test.
    expect(result.errors?.[0]?.message).toContain('Property schema is not expected to be here')
    expect(result.valid).toBe(false)
  })

  it('openapi2', async () => {
    const result = await validate(openapi2)

    // 203 errors in this file, this may not be an effective test.
    expect(result.errors?.[0]?.message).toBe('Property schema is not expected to be here')
    expect(result.valid).toBe(false)
  })

  it('openapi3', async () => {
    const result = await validate(openapi3)

    // 203 here as well.
    expect(result.errors?.[0]?.message).toBe('Property schema is not expected to be here')
    expect(result.valid).toBe(false)
  })
})
