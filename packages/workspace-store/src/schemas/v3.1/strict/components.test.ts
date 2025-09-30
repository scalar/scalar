import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ComponentsObject, ComponentsObjectSchema } from './openapi-document'

describe('components', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof ComponentsObjectSchema>>
      type TypescriptType = RequiredDeep<ComponentsObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('coerces invalid values to valid components object', () => {
      // Test coercing an invalid object with non-object values
      const invalidInput = {
        schemas: 'invalid', // string instead of object
        responses: 123, // number instead of object
        parameters: null, // null instead of object
      }

      const result = coerceValue(ComponentsObjectSchema, invalidInput)

      // Should coerce invalid values appropriately
      expect(typeof result).toBe('object')
    })

    it('parses valid components object correctly', () => {
      const validInput = {
        schemas: {
          Pet: {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
              tag: {
                type: 'string',
              },
            },
          },
        },
        responses: {
          NotFound: {
            description: 'Entity not found',
          },
        },
        parameters: {
          skipParam: {
            name: 'skip',
            in: 'query',
            description: 'number of items to skip',
            schema: {
              type: 'integer',
              format: 'int32',
            },
          },
        },
        examples: {
          PetExample: {
            summary: 'An example of a pet',
            value: {
              name: 'Fluffy',
              tag: 'dog',
            },
          },
        },
        securitySchemes: {
          ApiKeyAuth: {
            type: 'apiKey',
            in: 'header',
            name: 'X-API-Key',
            'x-scalar-secret-token': 'test-api-key',
          },
        },
      }

      const result = coerceValue(ComponentsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ComponentsObjectSchema, invalidInput)).toBe(false)
    })
  })
})
