import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import invalidSchema from './invalidSchema.json'

describe('invalidSchema', () => {
  it('returns an error', async () => {
    const result = await validate(invalidSchema)

    console.log(result.errors)

    // The auth schema is invalid, it specifies true rather than a string for the type.
    // If it provided a valid type, the error would reflect the incorrect keys for that type.
    expect(result.errors?.[0]?.message).toBe('oneOf must match exactly one schema in oneOf')
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
