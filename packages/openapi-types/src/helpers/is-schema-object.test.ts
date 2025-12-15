import { describe, expect, expectTypeOf, it } from 'vitest'
import { isSchemaObject } from './is-schema-object'
import type { OpenAPIV3_1 } from '../openapi-types'

describe('isSchemaObject', () => {
  it('returns true for object schemas', () => {
    const schema: OpenAPIV3_1.SchemaObject = { type: 'string' }
    expect(isSchemaObject(schema)).toBe(true)
    expectTypeOf(isSchemaObject).returns.toBeBoolean()
  })

  it('returns true for complex object schemas', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
    }
    expect(isSchemaObject(schema)).toBe(true)
  })

  it('returns false for boolean true schema', () => {
    const schema: OpenAPIV3_1.SchemaObject = true
    expect(isSchemaObject(schema)).toBe(false)
  })

  it('returns false for boolean false schema', () => {
    const schema: OpenAPIV3_1.SchemaObject = false
    expect(isSchemaObject(schema)).toBe(false)
  })

  it('returns false for null', () => {
    expect(isSchemaObject(null)).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(isSchemaObject(undefined)).toBe(false)
  })

  it('returns false for primitive types', () => {
    expect(isSchemaObject('string')).toBe(false)
    expect(isSchemaObject(123)).toBe(false)
    expect(isSchemaObject({})).toBe(true)
  })

  it('works with unknown types from getResolvedRef', () => {
    const resolved = {} as unknown
    if (isSchemaObject(resolved)) {
      // Type should be narrowed correctly
      expectTypeOf(resolved).toMatchTypeOf<Exclude<OpenAPIV3_1.SchemaObject, boolean>>()
    }
  })

  it('narrows type correctly when used in type guard', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'string',
      format: 'email',
    }

    if (isSchemaObject(schema)) {
      // Type should be narrowed to exclude boolean
      expectTypeOf(schema).toMatchTypeOf<Exclude<OpenAPIV3_1.SchemaObject, boolean>>()
      // Should be able to access object properties
      expect(schema.type).toBe('string')
    }
  })

  it('handles boolean schema in type guard', () => {
    const schema: OpenAPIV3_1.SchemaObject = true

    if (!isSchemaObject(schema)) {
      // Type should be narrowed to boolean
      expectTypeOf(schema).toBeBoolean()
      expect(schema).toBe(true)
    }
  })

  it('works with schemas containing x- extensions', () => {
    const schema: OpenAPIV3_1.SchemaObject = {
      type: 'string',
      'x-variable': 'test',
    }
    expect(isSchemaObject(schema)).toBe(true)
    if (isSchemaObject(schema)) {
      expect(schema['x-variable']).toBe('test')
    }
  })
})
