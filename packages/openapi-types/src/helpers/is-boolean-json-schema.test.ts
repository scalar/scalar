import { describe, expect, expectTypeOf, it } from 'vitest'

import { isBooleanJsonSchema } from './is-boolean-json-schema'

describe('isBooleanJsonSchema', () => {
  it('returns true for the boolean literal true', () => {
    expect(isBooleanJsonSchema(true)).toBe(true)
  })

  it('returns true for the boolean literal false', () => {
    expect(isBooleanJsonSchema(false)).toBe(true)
  })

  it('returns false for object schemas with type "boolean"', () => {
    expect(isBooleanJsonSchema({ type: 'boolean' })).toBe(false)
  })

  it('returns false for object schemas', () => {
    expect(isBooleanJsonSchema({ type: 'object' })).toBe(false)
    expect(isBooleanJsonSchema({})).toBe(false)
  })

  it('returns false for nullish values and other primitives', () => {
    expect(isBooleanJsonSchema(null)).toBe(false)
    expect(isBooleanJsonSchema(undefined)).toBe(false)
    expect(isBooleanJsonSchema(0)).toBe(false)
    expect(isBooleanJsonSchema('true')).toBe(false)
  })

  it('narrows to boolean', () => {
    const value: object | boolean = true

    if (isBooleanJsonSchema(value)) {
      expectTypeOf(value).toEqualTypeOf<boolean>()
    }
  })
})
