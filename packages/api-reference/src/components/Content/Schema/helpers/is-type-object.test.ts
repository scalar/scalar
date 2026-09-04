import { describe, expect, it } from 'vitest'

import { isTypeObject } from './is-type-object'

describe('is-type-object', () => {
  describe('isTypeObject', () => {
    it('returns true for schema with explicit type object', () => {
      const schema = {
        type: 'object',
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with properties', () => {
      const schema = {
        properties: {
          name: { type: 'string' },
          age: { type: 'number' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with additionalProperties', () => {
      const schema = {
        additionalProperties: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with patternProperties', () => {
      const schema = {
        patternProperties: {
          '^[a-z]+$': { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with multiple object indicators', () => {
      const schema = {
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
      const schema = {
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
      const schema = {
        type: 'array',
        items: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type string', () => {
      const schema = {
        type: 'string',
        minLength: 1,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type number', () => {
      const schema = {
        type: 'number',
        minimum: 0,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type boolean', () => {
      const schema = {
        type: 'boolean',
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with type integer', () => {
      const schema = {
        type: 'integer',
        minimum: 0,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('handles schema with empty properties object', () => {
      const schema = {
        properties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with empty additionalProperties', () => {
      const schema = {
        additionalProperties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with empty patternProperties', () => {
      const schema = {
        patternProperties: {},
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with additionalProperties set to false', () => {
      const schema = {
        additionalProperties: false,
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('handles schema with additionalProperties set to true', () => {
      const schema = {
        additionalProperties: true,
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with union type including object', () => {
      const schema = {
        type: ['object', 'null'],
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns true for schema with union type object first', () => {
      const schema = {
        type: ['object', 'string'],
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(true)
    })

    it('returns false for schema with union type not including object', () => {
      const schema = {
        type: ['string', 'null'],
        minLength: 1,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with union type array', () => {
      const schema = {
        type: ['array', 'null'],
        items: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with oneOf composition', () => {
      const schema = {
        oneOf: [{ type: 'string' }, { type: 'number' }],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with anyOf composition', () => {
      const schema = {
        anyOf: [{ type: 'object', properties: { name: { type: 'string' } } }, { type: 'null' }],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with allOf composition', () => {
      const schema = {
        allOf: [{ type: 'object' }, { properties: { id: { type: 'string' } } }],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with not composition', () => {
      const schema = {
        not: { type: 'string' },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with multiple composition keywords', () => {
      const schema = {
        oneOf: [{ type: 'string' }],
        anyOf: [{ type: 'number' }],
        allOf: [{ type: 'object' }],
        not: { type: 'boolean' },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with composition and object properties', () => {
      const schema = {
        oneOf: [{ type: 'string' }],
        properties: {
          name: { type: 'string' },
        },
        additionalProperties: false,
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with composition and type object', () => {
      const schema = {
        type: 'object',
        oneOf: [{ type: 'string' }],
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with composition and union type including object', () => {
      const schema = {
        type: ['object', 'null'],
        oneOf: [{ type: 'string' }],
        properties: {
          name: { type: 'string' },
        },
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with empty oneOf array', () => {
      const schema = {
        oneOf: [],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with empty anyOf array', () => {
      const schema = {
        anyOf: [],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with empty allOf array', () => {
      const schema = {
        allOf: [],
      }

      expect(isTypeObject(schema)).toBe(false)
    })

    it('returns false for schema with composition and other non-object properties', () => {
      const schema = {
        oneOf: [{ type: 'string' }],
        title: 'Composition Schema',
        description: 'A schema with composition',
        required: ['field'],
      }

      expect(isTypeObject(schema)).toBe(false)
    })
  })
})
