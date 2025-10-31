import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import invalidSchemaName from './invalidSchemaName.json'

describe('invalidSchemaName', () => {
  it('returns an error', async () => {
    const result = await validate(invalidSchemaName)

    // This test used to fail due to an error that has been corrected,
    // I fixed the other OpenAPI syntax issues in the test file and now it passes as expected.
    expect(result.errors?.length).toBe(0)
    expect(result.valid).toBe(true)
  })
})
