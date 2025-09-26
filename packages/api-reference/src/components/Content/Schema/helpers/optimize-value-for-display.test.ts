import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { optimizeValueForDisplay } from './optimize-value-for-display'

describe('optimizeValueForDisplay', () => {
  it('should return the original value if it is not an object', () => {
    // @ts-expect-error
    expect(optimizeValueForDisplay(1)).toEqual(1)
  })

  it('should return the original value if there is no discriminator type', () => {
    const input: SchemaObject = { type: 'string' }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should return the original value if discriminator schemas is not an array', () => {
    const input: SchemaObject = { _: '', oneOf: 'not an array' } as any
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should ignore the not discriminator type', () => {
    const input: SchemaObject = { _: '', not: { type: 'string' } }
    expect(optimizeValueForDisplay(input)).toEqual(input)
  })

  it('should mark as nullable if schema contains null type', () => {
    const input: SchemaObject = {
      _: '',
      oneOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      _: '',
      type: 'string',
      nullable: true,
    })
  })

  it('should remove null types from schemas', () => {
    const input = {
      anyOf: [{ type: 'string' }, { type: 'null' }, { type: 'number' }],
    }
    expect(optimizeValueForDisplay(input as any)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should merge single remaining schema after null removal', () => {
    const input: SchemaObject = {
      _: '',
      oneOf: [{ type: 'string', format: 'date-time' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input as any)).toEqual({
      _: '',
      type: 'string',
      format: 'date-time',
      nullable: true,
    })
  })

  it('should handle multiple remaining schemas', () => {
    const input = {
      anyOf: [{ type: 'string' }, { type: 'number' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input as any)).toEqual({
      anyOf: [{ type: 'string' }, { type: 'number' }],
      nullable: true,
    })
  })

  it('should preserve other properties when optimizing', () => {
    const input: SchemaObject = {
      _: '',
      description: 'test field',
      oneOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      _: '',
      description: 'test field',
      type: 'string',
      nullable: true,
    })
  })

  it('should handle allOf discriminator', () => {
    const input: SchemaObject = {
      _: '',
      allOf: [{ type: 'string' }, { type: 'null' }],
    }
    expect(optimizeValueForDisplay(input)).toEqual({
      _: '',
      type: 'string',
      nullable: true,
    })
  })

  it('preserves schema properties when merging allOf schemas', () => {
    const input: SchemaObject = {
      _: '',
      oneOf: [
        {
          _: '',
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
          _: '',
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
    }

    const result = optimizeValueForDisplay(input)

    expect(getResolvedRef(result?.oneOf?.[0])?.title).toBe('Planet')
    expect(getResolvedRef(result?.oneOf?.[1])?.title).toBe('Satellite')
  })

  it('should preserve root properties when processing oneOf schemas', () => {
    const input: SchemaObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
        name: { type: 'string' },
      },
      oneOf: [
        { required: ['id'], type: 'object' },
        { required: ['name'], type: 'object' },
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

  it('should merge root properties into oneOf schemas when they contain allOf', () => {
    const input = {
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
    }

    const result = optimizeValueForDisplay(input as any)

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
    }

    const result = optimizeValueForDisplay(input as any)

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
          allOf: [{ type: 'object' }, { properties: { foo: { type: 'string' } } }, { required: ['foo'] }],
        },
        {
          type: 'string',
        },
      ],
    }

    const result = optimizeValueForDisplay(input as any)

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
    const input: SchemaObject = {
      type: 'object',
      properties: {
        id: { type: 'string' },
      },
      oneOf: [
        {
          '_': '',
          title: 'FirstSchema',
          allOf: [
            { required: ['id'], type: 'object' },
            { properties: { name: { type: 'string' } }, type: 'object' },
          ],
        },
        {
          '_': '',
          title: 'SecondSchema',
          allOf: [
            { required: ['id'], type: 'object' },
            { properties: { email: { type: 'string' } }, type: 'object' },
          ],
        },
      ],
    }

    const result = optimizeValueForDisplay(input)

    expect(result).toEqual({
      oneOf: [
        {
          '_': '',
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          title: 'FirstSchema',
          allOf: [
            { required: ['id'], type: 'object' },
            { properties: { name: { type: 'string' } }, 'type': 'object' },
          ],
        },
        {
          type: 'object',
          properties: {
            id: { type: 'string' },
          },
          title: 'SecondSchema',
          '_': '',
          allOf: [
            { required: ['id'], 'type': 'object' },
            { properties: { email: { type: 'string' } }, type: 'object' },
          ],
        },
      ],
    })
  })
})
