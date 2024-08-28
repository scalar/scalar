import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src'
import invalidSchema from './invalidSchema.json'

describe('invalidSchema', () => {
  it('returns an error', async () => {
    const result = await validate(invalidSchema)

    // TODO: Swagger Editor
    //
    // Resolver error at paths./test.$ref
    // Could not resolve reference: undefined undefined
    expect(result.errors?.[0]?.message).toBe(
      `must have required property '$ref'`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
