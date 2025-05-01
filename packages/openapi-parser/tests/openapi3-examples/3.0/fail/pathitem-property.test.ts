import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import pathitemProperty from './pathitem-property.yaml?raw'

describe('pathitem-property', () => {
  it('returns an error', async () => {
    const result = await validate(pathitemProperty)

    expect(result.errors?.[0]?.message).toBe(
      `Property GET is not expected to be here`,
    )
    expect(result.errors?.length).toBe(1)
    expect(result.valid).toBe(false)
  })
})
