import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getCompositionSchemaMapping, hasComposition } from './schema-composition'

describe('schema-composition', () => {
  describe('getCompositionSchemaMapping', () => {
    it('returns undefined for non-array composition', () => {
      const schema = {
        oneOf: 'not an array',
      } as unknown as OpenAPIV3_1.SchemaObject
      expect(getCompositionSchemaMapping(schema, 'oneOf')).toBeUndefined()
    })

    it('creates mapping from schema titles', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [
          { title: 'Dog', type: 'object' },
          { title: 'Cat', type: 'object' },
        ],
      }
      expect(getCompositionSchemaMapping(schema, 'oneOf')).toEqual({
        Dog: 'Dog',
        Cat: 'Cat',
      })
    })

    it('creates mapping from type enum values', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [
          {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['dog'] },
            },
          },
          {
            type: 'object',
            properties: {
              type: { type: 'string', enum: ['cat'] },
            },
          },
        ],
      }
      expect(getCompositionSchemaMapping(schema, 'oneOf')).toEqual({
        dog: 'dog',
        cat: 'cat',
      })
    })

    it('returns undefined for empty mapping', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'object' }, { type: 'object' }],
      }
      expect(getCompositionSchemaMapping(schema, 'oneOf')).toBeUndefined()
    })
  })

  describe('hasComposition', () => {
    it('returns true for schema with oneOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'object' }],
      }
      expect(hasComposition(schema)).toBe(true)
    })

    it('returns true for schema with anyOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        anyOf: [{ type: 'object' }],
      }
      expect(hasComposition(schema)).toBe(true)
    })

    it('returns true for schema with allOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        allOf: [{ type: 'object' }],
      }
      expect(hasComposition(schema)).toBe(true)
    })

    it('returns false for schema without compositions', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
      }
      expect(hasComposition(schema)).toBe(false)
    })
  })
})
