import type { SchemaObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { getEnumValues } from './get-enum-values'

describe('get-enum-values', () => {
  describe('getEnumValues', () => {
    it('returns empty array for undefined value', () => {
      expect(getEnumValues(undefined)).toEqual([])
    })

    it('returns enum values from schema with enum property', () => {
      const schema = {
        type: 'string',
        enum: ['red', 'green', 'blue'],
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual(['red', 'green', 'blue'])
    })

    it('returns enum values from array items when schema is array type', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
          enum: ['small', 'medium', 'large'],
        },
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual(['small', 'medium', 'large'])
    })

    it('returns empty array when array schema has items without enum', () => {
      const schema = {
        type: 'array',
        items: {
          type: 'string',
        },
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual([])
    })

    it('returns empty array for schema without enum or array items enum', () => {
      const schema = {
        type: 'string',
        minLength: 1,
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual([])
    })

    it('returns enum values from array items when items is a $ref object', () => {
      const schema = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/Color',
          '$ref-value': {
            type: 'string',
            enum: ['red', 'green', 'blue'],
          },
        },
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual(['red', 'green', 'blue'])
    })

    it('returns empty array when array items $ref has no enum', () => {
      const schema = {
        type: 'array',
        items: {
          $ref: '#/components/schemas/String',
          '$ref-value': {
            type: 'string',
          },
        },
      } as SchemaObject

      expect(getEnumValues(schema)).toEqual([])
    })
  })
})
