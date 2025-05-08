import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import deprecated from './deprecated.yaml?raw'

describe('deprecated', () => {
  it('returns an error', async () => {
    const result = await validate(deprecated)

    expect(result.errors?.[0]?.message).toBe(`type must be boolean`)
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
