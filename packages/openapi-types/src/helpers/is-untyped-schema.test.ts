import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isUntypedSchema } from './is-untyped-schema'

describe('isUntypedSchema', () => {
  it('returns true when type is not set', () => {
    expect(isUntypedSchema({})).toBe(true)
    expect(isUntypedSchema({ description: 'no type here' })).toBe(true)
  })

  it('returns true for compositional schemas without type', () => {
    expect(isUntypedSchema({ allOf: [{ type: 'string' }] })).toBe(true)
    expect(isUntypedSchema({ oneOf: [{ type: 'string' }] })).toBe(true)
  })

  it('returns false when type is set', () => {
    expect(isUntypedSchema({ type: 'object' })).toBe(false)
    expect(isUntypedSchema({ type: ['string', 'null'] })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isUntypedSchema(null)).toBe(false)
    expect(isUntypedSchema(undefined)).toBe(false)
    expect(isUntypedSchema(true)).toBe(false)
  })

  it('returns false for ReferenceObject values', () => {
    expect(isUntypedSchema({ $ref: '#/components/schemas/Pet' })).toBe(false)
    expect(isUntypedSchema({ $ref: '#/components/schemas/Pet', description: 'a pet' })).toBe(false)
  })

  it('returns false for arrays', () => {
    expect(isUntypedSchema([])).toBe(false)
    expect(isUntypedSchema([{ type: 'string' }])).toBe(false)
  })

  it('accepts the UntypedObject variant of the strict 3.1 SchemaObject', () => {
    const schema: SchemaObjectV3_1 = { description: 'untyped' }
    expect(isUntypedSchema(schema)).toBe(true)
  })

  it('narrows a SchemaObject | ReferenceObject union away from references', () => {
    const schema: SchemaObjectV3_1 | { $ref: string } = { description: 'untyped' }

    if (isUntypedSchema(schema)) {
      expectTypeOf(schema).not.toExtend<{ $ref: string }>()
    }
  })
})
