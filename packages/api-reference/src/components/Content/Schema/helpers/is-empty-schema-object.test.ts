import { describe, expect, it } from 'vitest'

import { isEmptySchemaObject } from './is-empty-schema-object'

describe('isEmptySchemaObject', () => {
  it('returns true for empty object schema', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {},
      }),
    ).toBe(true)
  })

  it('returns true for object schema without properties key', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
      }),
    ).toBe(true)
  })

  it('returns false for object schema with properties', () => {
    expect(
      isEmptySchemaObject({
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }),
    ).toBe(false)
  })

  it('returns false for non-object schema', () => {
    expect(
      isEmptySchemaObject({
        type: 'string',
      }),
    ).toBe(false)
  })

  it('returns false for undefined schema', () => {
    expect(isEmptySchemaObject(undefined)).toBe(false)
  })
})
