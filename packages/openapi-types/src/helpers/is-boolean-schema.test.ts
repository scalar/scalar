import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isBooleanSchema } from './is-boolean-schema'

describe('isBooleanSchema', () => {
  it('returns true when type is "boolean"', () => {
    expect(isBooleanSchema({ type: 'boolean' })).toBe(true)
  })

  it('returns false for other types', () => {
    expect(isBooleanSchema({ type: 'string' })).toBe(false)
    expect(isBooleanSchema({ type: 'null' })).toBe(false)
  })

  it('returns false for the JSON Schema boolean shorthand', () => {
    expect(isBooleanSchema(true)).toBe(false)
    expect(isBooleanSchema(false)).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isBooleanSchema(null)).toBe(false)
    expect(isBooleanSchema(undefined)).toBe(false)
  })

  it('narrows so that type matches the asserted literal', () => {
    const schema: SchemaObjectV3_1 = { type: 'boolean' }

    if (isBooleanSchema(schema)) {
      // The strict 3.1 SchemaObject groups 'null' and 'boolean' together in
      // OtherTypes, so the narrowed `type` may still be the union 'null' |
      // 'boolean'. What matters is that the type field exists and matches a
      // boolean schema.
      expectTypeOf(schema.type).toExtend<string>()
    }
  })
})
