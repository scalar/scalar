import { describe, expect, it } from 'vitest'

import { validate } from '../../../../src/index'
import refAsInteger from './refAsInteger.yaml?raw'

describe('refAsInteger', () => {
  it('returns an error', async () => {
    const result = await validate(refAsInteger)

    // TODO: Swagger Editor
    //
    // Structural error at components.schemas.mySchema.$ref
    // should be string
    expect(result.errors?.[0]?.message).toBe(
      `Property $ref is not expected to be here`,
    )
    expect(result.errors?.[1]?.message).toBe('type must be string')
    expect(result.errors?.[2]?.message).toBe(
      'oneOf must match exactly one schema in oneOf',
    )
    expect(result.errors?.length).toBe(3)

    expect(result.valid).toBe(false)
  })
})
