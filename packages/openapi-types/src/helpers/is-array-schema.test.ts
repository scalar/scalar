import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isArraySchema } from './is-array-schema'

describe('isArraySchema', () => {
  it('returns true when type is "array"', () => {
    expect(isArraySchema({ type: 'array', items: { type: 'string' } })).toBe(true)
  })

  it('returns false for schemas of other types', () => {
    expect(isArraySchema({ type: 'object' })).toBe(false)
    expect(isArraySchema({ type: 'string' })).toBe(false)
  })

  it('returns false when type is missing', () => {
    expect(isArraySchema({ items: { type: 'string' } })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isArraySchema(null)).toBe(false)
    expect(isArraySchema(undefined)).toBe(false)
    expect(isArraySchema([])).toBe(false)
  })

  it('exposes array-specific properties after narrowing', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'array',
      items: { type: 'string' },
      minItems: 1,
    }

    if (isArraySchema(schema)) {
      expectTypeOf(schema.items).not.toBeNever()
      expectTypeOf(schema.minItems).not.toBeNever()
    }
  })
})
