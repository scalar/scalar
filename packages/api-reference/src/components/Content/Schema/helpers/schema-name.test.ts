import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getModelNameFromSchema, getCompositionDisplay } from './schema-name'

describe('schema-name', () => {
  describe('getModelNameFromSchema', () => {
    it('returns title when present', () => {
      const schema: OpenAPIV3_1.SchemaObject = { title: 'Galaxy Planet', type: 'object' }
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('returns name when present', () => {
      const schema = { name: 'Galaxy Planet', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('prefers title over name', () => {
      const schema = { title: 'Galaxy Planet', name: 'Other Name', type: 'object' } as any
      expect(getModelNameFromSchema(schema)).toBe('Galaxy Planet')
    })

    it('finds schema name from schemas dictionary', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: { id: { type: 'string' } },
      }
      const schemas = {
        GalaxyPlanet: { type: 'object', properties: { id: { type: 'string' } } },
        Satellite: { type: 'object', properties: { name: { type: 'string' } } },
      }
      expect(getModelNameFromSchema(schema, schemas)).toBe('GalaxyPlanet')
    })

    it('handles array types with items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelNameFromSchema(schema)).toBe('Array of string')
    })

    it('handles array types with any items', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: {},
      }
      expect(getModelNameFromSchema(schema)).toBe('Array of any')
    })

    it('returns type when no other name available', () => {
      const schema: OpenAPIV3_1.SchemaObject = { type: 'string' }
      expect(getModelNameFromSchema(schema)).toBe('string')
    })

    it('handles union types', () => {
      const schema: OpenAPIV3_1.SchemaObject = { type: ['string', 'null'] }
      expect(getModelNameFromSchema(schema)).toBe('string | null')
    })

    it('returns first object key as fallback', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        properties: { name: { type: 'string' } },
      }
      expect(getModelNameFromSchema(schema)).toBe('properties')
    })

    it('returns null for empty object', () => {
      const schema: OpenAPIV3_1.SchemaObject = {}
      expect(getModelNameFromSchema(schema)).toBe(null)
    })
  })

  describe('selectSchemasForLabeling', () => {
    it('uses original schemas when they have $ref', () => {
      const originalSchemas: OpenAPIV3_1.ReferenceObject[] = [
        { $ref: '#/components/schemas/Planet' },
        { $ref: '#/components/schemas/Satellite' },
      ]
      const processedSchemas: OpenAPIV3_1.SchemaObject[] = [
        { type: 'object', properties: { id: { type: 'string' } } },
        { type: 'object', properties: { name: { type: 'string' } } },
      ]

      const result = getCompositionDisplay(originalSchemas, processedSchemas)
      expect(result).toBe(originalSchemas)
    })

    it('uses original schemas when they have custom names', () => {
      const originalSchemas: OpenAPIV3_1.SchemaObject[] = [
        { title: 'UserProfile', type: 'object' },
        { title: 'CustomerData', type: 'object' },
      ]
      const processedSchemas: OpenAPIV3_1.SchemaObject[] = [{ type: 'object' }, { type: 'object' }]

      const result = getCompositionDisplay(originalSchemas, processedSchemas)
      expect(result).toBe(originalSchemas)
    })

    it('uses processed schemas when they have custom names but original do not', () => {
      const originalSchemas: OpenAPIV3_1.SchemaObject[] = [{ allOf: [{ title: 'Planet' }, { type: 'object' }] }]
      const processedSchemas: OpenAPIV3_1.SchemaObject[] = [{ title: 'Planet', type: 'object' }]

      const result = getCompositionDisplay(originalSchemas, processedSchemas)
      expect(result).toBe(processedSchemas)
    })

    it('defaults to original schemas when neither have custom names', () => {
      const originalSchemas: OpenAPIV3_1.SchemaObject[] = [{ type: 'object' }, { type: 'string' }]
      const processedSchemas: OpenAPIV3_1.SchemaObject[] = [{ type: 'object' }, { type: 'string' }]

      const result = getCompositionDisplay(originalSchemas, processedSchemas)
      expect(result).toBe(originalSchemas)
    })

    it('uses schemas dictionary for name lookup', () => {
      const originalSchemas: OpenAPIV3_1.SchemaObject[] = [{ type: 'object', properties: { id: { type: 'string' } } }]
      const processedSchemas: OpenAPIV3_1.SchemaObject[] = [{ type: 'object' }]
      const schemas = {
        GalaxyPlanet: { type: 'object', properties: { id: { type: 'string' } } },
      }

      const result = getCompositionDisplay(originalSchemas, processedSchemas, schemas)
      expect(result).toBe(originalSchemas)
    })
  })
})
