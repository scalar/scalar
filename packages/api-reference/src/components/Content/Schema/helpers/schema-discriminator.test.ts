import { describe, expect, it } from 'vitest'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'

import { getDiscriminatorMapping, getDiscriminatorPropertyName, hasDiscriminator } from './schema-discriminator'

describe('schema-discriminator', () => {
  describe('getDiscriminatorMapping', () => {
    it('returns undefined for non-array discriminator', () => {
      const schema = {
        oneOf: 'not an array',
      } as unknown as OpenAPIV3_1.SchemaObject
      expect(getDiscriminatorMapping(schema, 'oneOf')).toBeUndefined()
    })

    it('creates mapping from schema titles', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [
          { title: 'Dog', type: 'object' },
          { title: 'Cat', type: 'object' },
        ],
      }
      expect(getDiscriminatorMapping(schema, 'oneOf')).toEqual({
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
      expect(getDiscriminatorMapping(schema, 'oneOf')).toEqual({
        dog: 'dog',
        cat: 'cat',
      })
    })

    it('returns undefined for empty mapping', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'object' }, { type: 'object' }],
      }
      expect(getDiscriminatorMapping(schema, 'oneOf')).toBeUndefined()
    })
  })

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

  describe('hasDiscriminator', () => {
    it('returns true for schema with oneOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        oneOf: [{ type: 'object' }],
      }
      expect(hasDiscriminator(schema)).toBe(true)
    })

    it('returns true for schema with anyOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        anyOf: [{ type: 'object' }],
      }
      expect(hasDiscriminator(schema)).toBe(true)
    })

    it('returns true for schema with allOf', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        allOf: [{ type: 'object' }],
      }
      expect(hasDiscriminator(schema)).toBe(true)
    })

    it('returns false for schema without discriminators', () => {
      const schema: OpenAPIV3_1.SchemaObject = {
        type: 'object',
      }
      expect(hasDiscriminator(schema)).toBe(false)
    })
  })
})
