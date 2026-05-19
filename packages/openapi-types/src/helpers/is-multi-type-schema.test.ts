import { describe, expect, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isMultiTypeSchema } from './is-multi-type-schema'

describe('isMultiTypeSchema', () => {
  it('returns true when type is an array of primitive types', () => {
    expect(isMultiTypeSchema({ type: ['string', 'null'] })).toBe(true)
  })

  it('returns false when type is a single string', () => {
    expect(isMultiTypeSchema({ type: 'string' })).toBe(false)
  })

  it('returns false when type is missing', () => {
    expect(isMultiTypeSchema({})).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isMultiTypeSchema(null)).toBe(false)
    expect(isMultiTypeSchema(['string', 'null'])).toBe(false)
  })

  it('accepts the MultiTypeObject variant of the strict 3.1 SchemaObject', () => {
    const schema: SchemaObjectV3_1 = { type: ['string', 'null'] }
    expect(isMultiTypeSchema(schema)).toBe(true)
  })
})
