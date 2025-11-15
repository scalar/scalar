import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import invalidSchemaName from './invalidSchemaName.json'

describe('invalidSchemaName', () => {
  it('returns an error', async () => {
    const result = await validate(invalidSchemaName)

    expect(result.errors?.length).toBe(0)
    expect(result.valid).toBe(true)
  })
})
