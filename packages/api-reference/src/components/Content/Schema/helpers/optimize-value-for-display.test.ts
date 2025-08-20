import { describe, expect, it } from 'vitest'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

import { optimizeValueForDisplay } from './optimize-value-for-display'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'

describe('optimizeValueForDisplay', () => {
  it('should return the original value if it is not an object', () => {
    // @ts-expect-error
    expect(optimizeValueForDisplay(1)).toEqual(1)
  })

  it('should return the original value if there is no discriminator type', () => {
    const input = coerceValue(SchemaObjectSchema, { type: 'string' })
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should return the original value if discriminator schemas is not an array', () => {
    const input = { oneOf: 'not an array' } as any
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should ignore the not discriminator type', () => {
    const input = coerceValue(SchemaObjectSchema, { not: { type: 'string' } })
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should mark as nullable if schema contains null type', () => {
    const input = coerceValue(SchemaObjectSchema, {
      oneOf: [{ type: 'string' }, { type: 'null' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('should remove null types from schemas', () => {
    const input = coerceValue(SchemaObjectSchema, {
      anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'number' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should merge single remaining schema after null removal', () => {
    const input = coerceValue(SchemaObjectSchema, {
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      format: 'date-time',
      nullable: true,
    })
  })

  it('should handle multiple remaining schemas', () => {
    const input = coerceValue(SchemaObjectSchema, {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should preserve other properties when optimizing', () => {
    const input = coerceValue(SchemaObjectSchema, {
      description: 'test field',
      oneOf: [{ type: 'string' }, { type: 'null' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      description: 'test field',
      type: 'string',
      nullable: true,
    })
  })

  it('should handle allOf discriminator', () => {
    const input = coerceValue(SchemaObjectSchema, {
      allOf: [{ type: 'string' }, { type: 'null' }],
    })
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('preserves schema properties when merging allOf schemas', () => {
    const input = coerceValue(SchemaObjectSchema, {
      oneOf: [
        {
          title: 'Planet',
          allOf: [
            {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                description: { type: 'string' },
              },
            },
          ],
        },
        {
          title: 'Satellite',
          allOf: [
            {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
            {
              type: 'object',
              properties: {
                description: { type: 'string' },
              },
            },
          ],
        },
      ],
    })

    const result = optimizeValueForDisplay(input)

    expect(getResolvedRef(result?.oneOf?.[0])?.title).toBe('Planet')
    expect(getResolvedRef(result?.oneOf?.[1])?.title).toBe('Satellite')
  })

  it('should preserve root properties when processing oneOf schemas', () => {
    const input = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      oneOf: [{ required: ['id'] }, { required: ['name'] }],
    })

    const result = optimizeValueForDisplay(input)

    expect(result).toEqual({
      oneOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['id'],
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['name'],
        },
      ],
    })
  })

  it('should merge root properties into oneOf schemas when they contain allOf', () => {
    const input = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      oneOf: [
        {
          allOf: [{ required: ['id'] }],
        },
        {
          allOf: [{ required: ['name'] }],
        },
      ],
    })

    const result = optimizeValueForDisplay(input)

    expect(result).toEqual({
      oneOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['id'],
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
            name: { type: 'string' },
          },
          required: ['name'],
        },
      ],
    })
  })

  it('should not merge allOf when it contains multiple items', () => {
    const input = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      oneOf: [
        {
          title: 'MultipleAllOf',
          allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' } } }],
        },
      ],
    })

    const result = optimizeValueForDisplay(input)

    // Since there's only one schema in oneOf, it gets merged with root properties
    // but the allOf with multiple items should be preserved
    expect(result).toEqual({
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      title: 'MultipleAllOf',
      allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' } } }],
    })
  })

  it('should preserve allOf with multiple items in anyOf compositions', () => {
    const input = coerceValue(SchemaObjectSchema, {
      description: 'A complex schema',
      anyOf: [
        {
          allOf: [{ type: 'object' }, { properties: { foo: { type: 'string' } } }, { required: ['foo'] }],
        },
        {
          type: 'string',
        },
      ],
    })

    const result = optimizeValueForDisplay(input)

    expect(result).toEqual({
      anyOf: [
        {
          description: 'A complex schema',
          allOf: [{ type: 'object' }, { properties: { foo: { type: 'string' } } }, { required: ['foo'] }],
        },
        {
          description: 'A complex schema',
          type: 'string',
        },
      ],
    })
  })

  it('should preserve multiple allOf items when merging root properties into multiple oneOf schemas', () => {
    const input = coerceValue(SchemaObjectSchema, {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      oneOf: [
        {
          title: 'FirstSchema',
          allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' } } }],
        },
        {
          title: 'SecondSchema',
          allOf: [{ required: ['id'] }, { properties: { email: { type: 'string' } } }],
        },
      ],
    })

    const result = optimizeValueForDisplay(input)

    expect(result).toEqual({
      oneOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          title: 'FirstSchema',
          allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' } } }],
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          title: 'SecondSchema',
          allOf: [{ required: ['id'] }, { properties: { email: { type: 'string' } } }],
        },
      ],
    })
  })
})
