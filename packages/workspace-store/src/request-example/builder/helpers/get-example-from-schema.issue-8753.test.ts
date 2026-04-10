import { describe, expect, it } from 'vitest'

import type { SchemaObject } from '@/schemas/v3.1/strict/openapi-document'

import { getExampleFromSchema } from './get-example-from-schema'

describe('get-example-from-schema - Issue #8753: allOf with $ref and description', () => {
  it('resolves allOf with $ref and description correctly', () => {
    const schema = {
      allOf: [
        {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
            value: { type: 'integer' as const },
          },
          required: ['name'],
        },
        {
          description: 'JSON file containing the data.',
        },
      ],
    } as SchemaObject

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should not be null - should resolve to an object with name and value
    expect(result).not.toBe(null)
    expect(result).toEqual({
      name: 'string',
      value: 1,
    })
  })

  it('handles allOf with only description object', () => {
    const schema = {
      allOf: [
        {
          type: 'string' as const,
        },
        {
          description: 'A string value',
        },
      ],
    } as SchemaObject

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should resolve to a string, not null
    expect(result).toBe('string')
  })

  it('handles allOf with multiple $refs', () => {
    const schema = {
      allOf: [
        {
          type: 'object' as const,
          properties: {
            id: { type: 'integer' as const },
          },
        },
        {
          type: 'object' as const,
          properties: {
            name: { type: 'string' as const },
          },
        },
        {
          description: 'Combined object',
        },
      ],
    } as SchemaObject

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should merge all properties
    expect(result).toEqual({
      id: 1,
      name: 'string',
    })
  })

  it('handles nested allOf in properties', () => {
    const schema = {
      type: 'object' as const,
      properties: {
        file: {
          allOf: [
            {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
                size: { type: 'integer' as const },
              },
            },
            {
              description: 'File metadata',
            },
          ],
        },
      },
    } as unknown as SchemaObject

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should resolve the nested allOf correctly
    expect(result).toEqual({
      file: {
        name: 'string',
        size: 1,
      },
    })
  })
})
