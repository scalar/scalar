import { describe, expect, it } from 'vitest'

import { getExampleFromSchema } from './get-example-from-schema'

describe('get-example-from-schema - Issue #8753: allOf with $ref and description', () => {
  it('resolves allOf with $ref and description correctly', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
            value: { type: 'integer' },
          },
          required: ['name'],
        },
        {
          description: 'JSON file containing the data.',
        },
      ],
    }

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
          type: 'string',
        },
        {
          description: 'A string value',
        },
      ],
    }

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should resolve to a string, not null
    expect(result).toBe('string')
  })

  it('handles allOf with multiple $refs', () => {
    const schema = {
      allOf: [
        {
          type: 'object',
          properties: {
            id: { type: 'integer' },
          },
        },
        {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
        {
          description: 'Combined object',
        },
      ],
    }

    const result = getExampleFromSchema(schema, { emptyString: 'string' })

    // Should merge all properties
    expect(result).toEqual({
      id: 1,
      name: 'string',
    })
  })

  it('handles nested allOf in properties', () => {
    const schema = {
      type: 'object',
      properties: {
        file: {
          allOf: [
            {
              type: 'object',
              properties: {
                name: { type: 'string' },
                size: { type: 'integer' },
              },
            },
            {
              description: 'File metadata',
            },
          ],
        },
      },
    }

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
