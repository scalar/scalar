import { describe, expect, it } from 'vitest'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/schema'

import { optimizeValueForDisplay } from './optimize-value-for-display'

describe('optimizeValueForDisplay', () => {
  it('should return the original value if it is not an object', () => {
    // @ts-expect-error
    expect(optimizeValueForDisplay(1)).toEqual(1)
  })

  it('should return the original value if there is no discriminator type', () => {
    const input = { type: 'string' as const }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should return the original value if discriminator schemas is not an array', () => {
    const input = { oneOf: 'not an array' as any }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should ignore the not discriminator type', () => {
    const input = { not: { type: 'string' as const } }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should mark as nullable if schema contains null type', () => {
    const input = {
      oneOf: [{ type: 'string' as const }, { type: 'null' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('should remove null types from schemas', () => {
    const input = {
      anyOf: [{ type: 'string' as const }, { type: 'null' as const }, { type: 'number' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should merge single remaining schema after null removal', () => {
    const input = {
      oneOf: [{ type: 'string' as const, format: 'date-time' }, { type: 'null' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      format: 'date-time',
      nullable: true,
    })
  })

  it('should handle multiple remaining schemas', () => {
    const input = {
      anyOf: [{ type: 'string' as const }, { type: 'number' as const }, { type: 'null' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should preserve other properties when optimizing', () => {
    const input = {
      description: 'test field',
      oneOf: [{ type: 'string' as const }, { type: 'null' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      description: 'test field',
      type: 'string',
      nullable: true,
    })
  })

  it('should handle allOf discriminator', () => {
    const input = {
      allOf: [{ type: 'string' as const }, { type: 'null' as const }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      type: 'string',
      nullable: true,
    })
  })

  it('preserves schema properties when merging allOf schemas', () => {
    const input = {
      oneOf: [
        {
          title: 'Planet',
          allOf: [
            {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
              },
            },
            {
              type: 'object' as const,
              properties: {
                description: { type: 'string' as const },
              },
            },
          ],
        },
        {
          title: 'Satellite',
          allOf: [
            {
              type: 'object' as const,
              properties: {
                name: { type: 'string' as const },
              },
            },
            {
              type: 'object' as const,
              properties: {
                description: { type: 'string' as const },
              },
            },
          ],
        },
      ],
    }

    const result = optimizeValueForDisplay(input as unknown as SchemaObject)

    expect(result?.oneOf?.[0]?.title).toBe('Planet')
    expect(result?.oneOf?.[1]?.title).toBe('Satellite')
  })

  it('should preserve root properties when processing oneOf schemas', () => {
    const input = {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
      },
      oneOf: [{ required: ['id'] }, { required: ['name'] }],
    }

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
    const input = {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const },
        name: { type: 'string' as const },
      },
      oneOf: [
        {
          allOf: [{ required: ['id'] }],
        },
        {
          allOf: [{ required: ['name'] }],
        },
      ],
    }

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
    const input = {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const },
      },
      oneOf: [
        {
          title: 'MultipleAllOf',
          allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' as const } } }],
        },
      ],
    }

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
    const input = {
      description: 'A complex schema',
      anyOf: [
        {
          allOf: [
            { type: 'object' as const },
            { properties: { foo: { type: 'string' as const } } },
            { required: ['foo'] },
          ],
        },
        {
          type: 'string' as const,
        },
      ],
    }

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
    const input = {
      type: 'object' as const,
      properties: {
        id: { type: 'string' as const },
      },
      oneOf: [
        {
          title: 'FirstSchema',
          allOf: [{ required: ['id'] }, { properties: { name: { type: 'string' as const } } }],
        },
        {
          title: 'SecondSchema',
          allOf: [{ required: ['id'] }, { properties: { email: { type: 'string' as const } } }],
        },
      ],
    }

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
