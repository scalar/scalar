import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isNumericSchema } from './is-numeric-schema'

describe('isNumericSchema', () => {
  it('returns true when type is "number"', () => {
    expect(isNumericSchema({ type: 'number' })).toBe(true)
  })

  it('returns true when type is "integer"', () => {
    expect(isNumericSchema({ type: 'integer' })).toBe(true)
  })

  it('returns false for other types', () => {
    expect(isNumericSchema({ type: 'string' })).toBe(false)
    expect(isNumericSchema({ type: 'boolean' })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isNumericSchema(1)).toBe(false)
    expect(isNumericSchema(null)).toBe(false)
  })

  it('exposes numeric-specific properties after narrowing', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'integer',
      minimum: 0,
      exclusiveMaximum: 100,
    }

    if (isNumericSchema(schema)) {
      expectTypeOf(schema.minimum).not.toBeNever()
      expectTypeOf(schema.exclusiveMaximum).not.toBeNever()
    }
  })
})
