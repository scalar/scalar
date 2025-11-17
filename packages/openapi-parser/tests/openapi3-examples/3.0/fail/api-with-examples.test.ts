import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import apiWithExamples from './api-with-examples.yaml?raw'

describe('api-with-examples', () => {
  it('returns an error', async () => {
    const result = await validate(apiWithExamples)

    // Structural error at paths./.get.responses.200.content.application/json.examples
    // should be object
    // …
    expect(result.errors?.[0]?.message).toBe('type must be object')
    expect(result.errors?.[1]?.message).toBe('type must be object')
    expect(result.errors?.[2]?.message).toBe('type must be object')
    expect(result.errors?.[3]?.message).toBe('type must be object')
    expect(result.errors?.length).toBe(4) // 4 total example shape errors in the test file
    expect(result.valid).toBe(false)
  })
})
