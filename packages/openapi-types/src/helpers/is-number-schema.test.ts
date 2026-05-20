import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isNumberSchema } from './is-number-schema'

describe('isNumberSchema', () => {
  it('returns true when type is "number"', () => {
    expect(isNumberSchema({ type: 'number' })).toBe(true)
  })

  it('returns false when type is "integer"', () => {
    expect(isNumberSchema({ type: 'integer' })).toBe(false)
  })

  it('returns false for other types', () => {
    expect(isNumberSchema({ type: 'string' })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isNumberSchema(42)).toBe(false)
    expect(isNumberSchema(null)).toBe(false)
  })

  it('exposes numeric-specific properties after narrowing', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'number',
      minimum: 0,
      maximum: 100,
      multipleOf: 0.5,
    }

    if (isNumberSchema(schema)) {
      expectTypeOf(schema.minimum).not.toBeNever()
      expectTypeOf(schema.maximum).not.toBeNever()
      expectTypeOf(schema.multipleOf).not.toBeNever()
    }
  })
})
