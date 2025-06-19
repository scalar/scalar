import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, it } from 'vitest'

import { getCompositionDisplay, getModelName, getModelNameFromSchema, getSchemaNameFromSchemas } from './schema-name'

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

  describe('getSchemaNameFromSchemas', () => {
    it('finds schema name by matching object properties', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          username: { type: 'string' },
          deletedAt: { type: 'string', format: 'date-time', nullable: true },
        },
      }
      const schemas = {
        UserRequest: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            username: { type: 'string' },
            deletedAt: { type: 'string', format: 'date-time', nullable: true },
          },
        },
        ProblemDetails: {
          type: 'object',
          properties: {
            type: { type: 'string', format: 'uri' },
            title: { type: 'string' },
            status: { type: 'integer', format: 'int32' },
          },
        },
      }
      expect(getSchemaNameFromSchemas(schema, schemas)).toBe('UserRequest')
    })

    it('finds schema name by matching array types', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'array',
        items: { type: 'string' },
      }
      const schemas = {
        StringArray: {
          type: 'array',
          items: { type: 'string' },
        },
        NumberArray: {
          type: 'array',
          items: { type: 'number' },
        },
      }
      expect(getSchemaNameFromSchemas(schema, schemas)).toBe('StringArray')
    })

    it('returns null when no matching schema found', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        properties: { id: { type: 'string' } },
      }
      const schemas = {
        User: {
          type: 'object',
          properties: { name: { type: 'string' } },
        },
      }
      expect(getSchemaNameFromSchemas(schema, schemas)).toBe(null)
    })

    it('returns null when schemas is undefined', () => {
      const schema: OpenAPIV3_1.SchemaObject = { type: 'object' }
      expect(getSchemaNameFromSchemas(schema)).toBe(null)
    })

    it('does not return schema name for simple primitive types', () => {
      const schema: OpenAPIV3_1.SchemaObject = { type: 'string' }
      const schemas = {
        foo: { type: 'string' },
        bar: { type: 'number' },
      }
      expect(getSchemaNameFromSchemas(schema, schemas)).toBe(null)
    })
  })

  describe('getModelName', () => {
    it('returns null when value has no type', () => {
      const value = { properties: { name: { type: 'string' } } }
      expect(getModelName(value)).toBe(null)
    })

    it('returns array type when hideModelNames is true', () => {
      const value = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelName(value, {}, true)).toBe('array string[]')
    })

    it('returns null when hideModelNames is true and not array', () => {
      const value = { type: 'object' }
      expect(getModelName(value, {}, true)).toBe(null)
    })

    it('returns model name with title', () => {
      const value = {
        type: 'object',
        title: 'Planet',
      }
      expect(getModelName(value)).toBe('Planet')
    })

    it('returns array model name with title', () => {
      const value = {
        type: 'array',
        title: 'PlanetArray',
      }
      expect(getModelName(value)).toBe('array PlanetArray[]')
    })

    it('finds schema name from component schemas', () => {
      const value = {
        type: 'object',
        properties: {
          name: { type: 'string' },
          email: { type: 'string' },
        },
      }
      const schemas = {
        User: {
          type: 'object',
          properties: {
            name: { type: 'string' },
            email: { type: 'string' },
          },
        },
      }
      expect(getModelName(value, schemas)).toBe('User')
    })

    it('handles array with item title', () => {
      const value = {
        type: 'array',
        items: {
          type: 'object',
          title: 'Planet',
        },
      }
      expect(getModelName(value)).toBe('array Planet[]')
    })

    it('handles array with item name', () => {
      const value = {
        type: 'array',
        items: {
          type: 'object',
          name: 'Planet',
        },
      }
      expect(getModelName(value)).toBe('array Planet[]')
    })

    it('handles array with basic item type', () => {
      const value = {
        type: 'array',
        items: { type: 'string' },
      }
      expect(getModelName(value)).toBe('array string[]')
    })

    it('handles array with object items fallback', () => {
      const value = {
        type: 'array',
        items: {},
      }
      expect(getModelName(value)).toBe('array object[]')
    })

    it('handles discriminator schema names', () => {
      const value = {
        type: 'array',
        items: { type: 'object' },
      }
      const mockGetDiscriminatorSchemaName = () => 'DiscriminatorModel'
      expect(getModelName(value, {}, false, mockGetDiscriminatorSchemaName)).toBe('array DiscriminatorModel[]')
    })

    it('returns null when no matching schema found for a primitive type (string)', () => {
      const value = {
        type: 'string',
      }
      const schemas = {
        Timestamp: {
          type: 'string',
          format: 'date-time',
          description: 'ISO-8601 Timestamp',
          example: '2024-11-30T10:04:46+00:00',
          readOnly: true,
        },
      }
      const result = getModelName(value, schemas)
      expect(result).toBe(null)
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
