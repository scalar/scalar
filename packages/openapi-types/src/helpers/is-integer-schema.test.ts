import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isIntegerSchema } from './is-integer-schema'

describe('isIntegerSchema', () => {
  it('returns true when type is "integer"', () => {
    expect(isIntegerSchema({ type: 'integer' })).toBe(true)
  })

  it('returns false when type is "number"', () => {
    expect(isIntegerSchema({ type: 'number' })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isIntegerSchema(1)).toBe(false)
    expect(isIntegerSchema(null)).toBe(false)
  })

  it('exposes numeric-specific properties after narrowing', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'integer',
      minimum: 0,
      maximum: 100,
    }

    if (isIntegerSchema(schema)) {
      expectTypeOf(schema.minimum).not.toBeNever()
      expectTypeOf(schema.maximum).not.toBeNever()
    }
  })
})
