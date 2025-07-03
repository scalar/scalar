import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'
import { isTypeObject } from './is-type-object'

describe('is-type-object', () => {
  describe('isTypeObject', () => {
    it('returns true for schema with explicit type object', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with properties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with additionalProperties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        additionalProperties: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with patternProperties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        patternProperties: {
          '^[a-z]+$': { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with multiple object indicators', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
        patternProperties: {
          '^[a-z]+$': { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns false for null input', () => {
      expect(isTypeObject(null)).toBe(false)
    })

    it('returns false for primitive types', () => {
      expect(isTypeObject('string')).toBe(false)
      expect(isTypeObject(123)).toBe(false)
      expect(isTypeObject(true)).toBe(false)
      expect(isTypeObject(undefined)).toBe(false)
    })

    it('returns false for arrays', () => {
      expect(isTypeObject([])).toBe(false)
      expect(isTypeObject([1, 2, 3])).toBe(false)
      expect(isTypeObject([{ type: 'object' }])).toBe(false)
    })

    it('returns false for schema with non-object type', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'string',
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for empty object without object indicators', () => {
      const schema = {}

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for object with other properties but no object indicators', () => {
      const schema = {
        title: 'My Schema',
        description: 'A schema description',
        required: ['name'],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type array', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type string', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'string',
        minLength: 1,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type number', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'number',
        minimum: 0,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type boolean', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'boolean',
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type integer', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'integer',
        minimum: 0,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('handles schema with empty properties object', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        properties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with empty additionalProperties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        additionalProperties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with empty patternProperties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        patternProperties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with additionalProperties set to false', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        additionalProperties: false,
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with additionalProperties set to true', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        additionalProperties: true,
      }

      expect(isTypeObject(schema)).toBe(true)
    })
  })
})
