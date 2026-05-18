import { openapiSchemas } from '@scalar/schemas/openapi/3.1'
import type { SchemaObject } from '@scalar/types/openapi/3.1'
import { coerce } from '@scalar/validation'
import { describe, expect, it } from 'vitest'

import { hasComplexArrayItems } from './has-complex-array-items'

describe('has-complex-array-items', () => {
  describe('hasComplexArrayItems', () => {
    it('returns false for non-array schema', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'string',
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })

    it('returns false for array with primitive items', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: { type: 'string' },
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })

    it('returns false for array with number items', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: { type: 'number' },
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })

    it('returns true for array with object items', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'object',
          properties: {
            name: { type: 'string' },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items that have properties but no explicit type', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          properties: {
            name: { type: 'string' },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items that have union type including object', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: ['object', 'null'],
          properties: {
            name: { type: 'string' },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items containing $ref', () => {
      const schema = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/User',
        },
      } as SchemaObject

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items containing discriminator', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          discriminator: {
            propertyName: 'type',
          },
          oneOf: [{ $ref: '#/components/schemas/Cat' }, { $ref: '#/components/schemas/Dog' }],
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items containing allOf composition', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          allOf: [
            { type: 'object', properties: { id: { type: 'string' } } },
            { type: 'object', properties: { name: { type: 'string' } } },
          ],
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items containing oneOf composition', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          oneOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { email: { type: 'string' } } },
          ],
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for array with items containing anyOf composition', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          anyOf: [
            { type: 'object', properties: { name: { type: 'string' } } },
            { type: 'object', properties: { age: { type: 'number' } } },
          ],
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for nested array with complex items (array of arrays of objects)', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'object',
            properties: {
              name: { type: 'string' },
            },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for nested array with items containing $ref', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'array',
          items: {
            $ref: '#/components/schemas/User',
          },
        },
      } as SchemaObject

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for nested array with items containing compositions', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'array',
          items: {
            allOf: [{ type: 'object', properties: { id: { type: 'string' } } }],
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for nested array with items that have properties', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'array',
          items: {
            properties: {
              name: { type: 'string' },
            },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns true for deeply nested arrays (array of arrays of arrays with objects)', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'array',
          items: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(true)
    })

    it('returns false for nested array with primitive items (array of arrays of strings)', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: {
          type: 'array',
          items: { type: 'string' },
        },
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })

    it('returns false for undefined input', () => {
      expect(hasComplexArrayItems(undefined)).toBe(false)
    })

    it('returns false for array without items', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })

    it('returns false for array with items as non-object', () => {
      const schema = coerce(openapiSchemas.schema, {
        type: 'array',
        items: 'string',
      })

      expect(hasComplexArrayItems(schema)).toBe(false)
    })
  })
})
