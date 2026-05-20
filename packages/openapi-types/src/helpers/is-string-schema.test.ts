import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isStringSchema } from './is-string-schema'

describe('isStringSchema', () => {
  it('returns true when type is "string"', () => {
    expect(isStringSchema({ type: 'string', minLength: 1 })).toBe(true)
  })

  it('returns false for schemas of other types', () => {
    expect(isStringSchema({ type: 'object' })).toBe(false)
    expect(isStringSchema({ type: 'array' })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isStringSchema('string')).toBe(false)
    expect(isStringSchema(null)).toBe(false)
  })

  it('exposes string-specific properties after narrowing', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'string',
      minLength: 1,
      maxLength: 10,
      pattern: '^[a-z]+$',
    }

    if (isStringSchema(schema)) {
      expectTypeOf(schema.minLength).not.toBeNever()
      expectTypeOf(schema.maxLength).not.toBeNever()
      expectTypeOf(schema.pattern).not.toBeNever()
    }
  })
})
