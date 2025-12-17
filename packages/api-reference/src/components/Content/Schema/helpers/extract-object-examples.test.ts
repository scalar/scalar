import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { extractObjectExamples } from './extract-object-examples'

describe('extractObjectExamples', () => {
  it('returns null for non-object schemas', () => {
    const schema: SchemaObject = {
      type: 'string',
    }

    const result = extractObjectExamples(schema)
    expect(result).toBeNull()
  })

  it('returns null for schemas without properties', () => {
    const schema: SchemaObject = {
      type: 'object',
    }

    const result = extractObjectExamples(schema)
    expect(result).toBeNull()
  })

  it('returns null when schema has properties but no examples', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' },
      },
    }

    const result = extractObjectExamples(schema)
    expect(result).toBeNull()
  })

  it('extracts examples from examples array', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      examples: [
        { name: 'Cam', age: 98 },
        { name: 'Hans', age: 97 },
      ],
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(
      new Map([
        ['name', ['Cam', 'Hans']],
        ['age', [98, 97]],
      ]),
    )
  })

  it('extracts examples from x-examples object', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      'x-examples': {
        'Example 1': {
          name: 'Marc',
          age: 99,
        },
        'Example 2': {
          name: 'John',
          age: 100,
        },
      },
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(
      new Map([
        ['name', ['Marc', 'John']],
        ['age', [99, 100]],
      ]),
    )
  })

  it('combines examples from both examples array and x-examples object', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      examples: [
        { name: 'Cam', age: 98 },
        { name: 'Hans', age: 97 },
      ],
      'x-examples': {
        'Example 1': {
          name: 'Marc',
          age: 99,
        },
      },
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(
      new Map([
        ['name', ['Cam', 'Hans', 'Marc']],
        ['age', [98, 97, 99]],
      ]),
    )
  })

  it('handles schemas with array type union including object', () => {
    const schema = {
      type: ['object', 'null'],
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
      },
      examples: [{ name: 'Test', age: 50 }],
    } as SchemaObject

    const result = extractObjectExamples(schema)

    expect(result).toEqual(
      new Map([
        ['name', ['Test']],
        ['age', [50]],
      ]),
    )
  })

  it('handles partial examples with missing properties', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
        age: { type: 'integer' },
        email: { type: 'string' },
      },
      examples: [{ name: 'Cam', age: 98 }, { name: 'Hans' }, { email: 'test@example.com' }],
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(
      new Map([
        ['name', ['Cam', 'Hans']],
        ['age', [98]],
        ['email', ['test@example.com']],
      ]),
    )
  })

  it('handles non-object examples gracefully', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      examples: ['not an object', null, { name: 'Valid' }],
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(new Map([['name', ['Valid']]]))
  })

  it('handles empty examples array', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      examples: [],
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(new Map())
  })

  it('handles empty x-examples object', () => {
    const schema: SchemaObject = {
      type: 'object',
      properties: {
        name: { type: 'string' },
      },
      'x-examples': {},
    }

    const result = extractObjectExamples(schema)

    expect(result).toEqual(new Map())
  })
})
