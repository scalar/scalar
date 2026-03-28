import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import refAsInteger from './refAsInteger.yaml?raw'

describe('refAsInteger', () => {
  it('returns an error', async () => {
    const result = await validate(refAsInteger)
    // With the fixed JSON Pointer regex (supporting $ in paths),
    // the error tree now correctly places $ref errors as children,
    // surfacing only the most specific error: type must be string
    expect(result.errors?.[0]?.message).toBe('type must be string')
    expect(result.errors?.length).toBe(1)

    expect(result.valid).toBe(false)
  })
})
