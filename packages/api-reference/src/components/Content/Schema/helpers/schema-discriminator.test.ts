import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import {
  getDiscriminatorMapping,
  getDiscriminatorPropertyName,
  hasDiscriminator,
  mergeDiscriminatorSchemas,
} from './schema-discriminator'

describe('schema-discriminator', () => {
  describe('getDiscriminatorPropertyName', () => {
    it('returns property name from discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        discriminator: {
          propertyName: 'type',
        },
      }
      expect(getDiscriminatorPropertyName(schema)).toBe('type')
    })

    it('returns undefined when no discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {}
      expect(getDiscriminatorPropertyName(schema)).toBeUndefined()
    })
  })

  describe('getDiscriminatorMapping', () => {
    it('returns mapping from discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        discriminator: {
          propertyName: 'type',
          mapping: {
            terrestrial: '#/components/schemas/TerrestrialPlanet',
            gas_giant: '#/components/schemas/GasGiant',
          },
        },
      }
      expect(getDiscriminatorMapping(schema)).toEqual({
        terrestrial: '#/components/schemas/TerrestrialPlanet',
        gas_giant: '#/components/schemas/GasGiant',
      })
    })
  })

  describe('hasDiscriminator', () => {
    it('returns true when schema has discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        discriminator: {
          propertyName: 'type',
        },
      }
      expect(hasDiscriminator(schema)).toBe(true)
    })

    it('returns false when schema has no discriminator', () => {
      const schema: OpenAPIV3_1.SchemaObject = {}
      expect(hasDiscriminator(schema)).toBe(false)
    })
  })

  describe('mergeDiscriminatorSchemas', () => {
    it('merges base schema with selected type schema', () => {
      const baseSchema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        required: ['name', 'type'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
        },
        discriminator: {
          propertyName: 'type',
          mapping: {
            terrestrial: '#/components/schemas/TerrestrialPlanet',
          },
        },
      }

      const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        TerrestrialPlanet: {
          type: 'object',
          required: ['atmosphere'],
          properties: {
            atmosphere: {
              type: 'array',
              items: {
                type: 'object',
                properties: {
                  compound: { type: 'string' },
                  percentage: { type: 'number' },
                },
              },
            },
          },
        },
      }

      const result = mergeDiscriminatorSchemas(baseSchema, 'terrestrial', schemas)
      expect(result).toEqual({
        type: 'object',
        required: ['name', 'type', 'atmosphere'],
        properties: {
          name: { type: 'string' },
          type: { type: 'string' },
          atmosphere: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                compound: { type: 'string' },
                percentage: { type: 'number' },
              },
            },
          },
        },
      })
    })

    it('merges schema with allOf composition', () => {
      const baseSchema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
        required: ['type'],
        properties: {
          type: { type: 'string' },
        },
        discriminator: {
          propertyName: 'type',
          mapping: {
            gas_giant: '#/components/schemas/GasGiantWithAllOf',
          },
        },
      }

      const schemas: Record<string, OpenAPIV3_1.SchemaObject> = {
        GasGiantWithAllOf: {
          type: 'object',
          allOf: [
            {
              type: 'object',
              required: ['mass'],
              properties: {
                mass: { type: 'number', format: 'float' },
              },
            },
            {
              type: 'object',
              required: ['satellites'],
              properties: {
                satellites: {
                  type: 'array',
                  items: { type: 'object' },
                },
              },
            },
          ],
        },
      }

      const result = mergeDiscriminatorSchemas(baseSchema, 'gas_giant', schemas)
      expect(result).toEqual({
        type: 'object',
        properties: {
          mass: { type: 'number', format: 'float' },
          satellites: {
            type: 'array',
            items: { type: 'object' },
          },
        },
        required: ['type', 'mass', 'satellites'],
      })
    })
  })
})
