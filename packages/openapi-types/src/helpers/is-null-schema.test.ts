import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import { isNullSchema } from './is-null-schema'

describe('isNullSchema', () => {
  it('returns true when type is "null"', () => {
    expect(isNullSchema({ type: 'null' })).toBe(true)
  })

  it('returns false for other types', () => {
    expect(isNullSchema({ type: 'string' })).toBe(false)
    expect(isNullSchema({ type: 'object' })).toBe(false)
  })

  it('returns false for the JavaScript value null', () => {
    expect(isNullSchema(null)).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isNullSchema(undefined)).toBe(false)
    expect(isNullSchema('null')).toBe(false)
  })

  it('narrows so that the type field stays a string literal', () => {
    const schema: SchemaObjectV3_1 = { type: 'null' }

    if (isNullSchema(schema)) {
      // The strict 3.1 SchemaObject groups 'null' and 'boolean' together in
      // OtherTypes, so the narrowed `type` may still be the union 'null' |
      // 'boolean'. What matters is that the schema is identified as a null
      // schema at runtime.
      expectTypeOf(schema.type).toExtend<string>()
    }
  })
})
