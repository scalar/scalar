import { describe, expect, expectTypeOf, it } from 'vitest'

import type { SchemaObject as SchemaObjectV3_0 } from '../../3.0/schema'
import type { SchemaObject as SchemaObjectV3_1 } from '../../3.1/schema'
import type { SchemaObject as SchemaObjectV3_2 } from '../../3.2/schema'
import type { OpenAPIV2, OpenAPIV3, OpenAPIV3_1, OpenAPIV3_2 } from '../openapi-types'
import { isObjectSchema } from './is-object-schema'

describe('isObjectSchema', () => {
  it('returns true when type is "object"', () => {
    expect(isObjectSchema({ type: 'object', properties: { name: { type: 'string' } } })).toBe(true)
  })

  it('returns false for schemas of other types', () => {
    expect(isObjectSchema({ type: 'string' })).toBe(false)
    expect(isObjectSchema({ type: 'array' })).toBe(false)
    expect(isObjectSchema({ type: 'integer' })).toBe(false)
  })

  it('returns false when type is missing', () => {
    expect(isObjectSchema({ properties: {} })).toBe(false)
  })

  it('returns false for non-objects', () => {
    expect(isObjectSchema(null)).toBe(false)
    expect(isObjectSchema(undefined)).toBe(false)
    expect(isObjectSchema(true)).toBe(false)
    expect(isObjectSchema('object')).toBe(false)
  })

  it('exposes object-specific properties on the strict 3.1 SchemaObject', () => {
    const schema: SchemaObjectV3_1 = {
      type: 'object',
      properties: { id: { type: 'string' } },
      required: ['id'],
    }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.properties).not.toBeNever()
      expectTypeOf(schema.required).not.toBeNever()
    }
  })

  it('exposes object-specific properties on the strict 3.0 SchemaObject', () => {
    const schema: SchemaObjectV3_0 = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.properties).not.toBeNever()
    }
  })

  it('exposes object-specific properties on the strict 3.2 SchemaObject', () => {
    const schema: SchemaObjectV3_2 = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.properties).not.toBeNever()
    }
  })

  it('narrows the loose OpenAPIV3.SchemaObject so type is "object"', () => {
    const schema: OpenAPIV3.SchemaObject = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.type).toEqualTypeOf<'object'>()
    }
  })

  it('narrows the loose OpenAPIV3_1.SchemaObject so type is "object"', () => {
    const schema: OpenAPIV3_1.SchemaObject = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.type).toEqualTypeOf<'object'>()
    }
  })

  it('narrows the loose OpenAPIV3_2.SchemaObject so type is "object"', () => {
    const schema: OpenAPIV3_2.SchemaObject = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.type).toEqualTypeOf<'object'>()
    }
  })

  it('narrows the OpenAPIV2.SchemaObject so object properties are reachable', () => {
    const schema: OpenAPIV2.SchemaObject = { type: 'object' }

    if (isObjectSchema(schema)) {
      expectTypeOf(schema.properties).not.toBeNever()
    }
  })
})
