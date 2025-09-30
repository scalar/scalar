import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type PathItemObject, PathItemObjectSchema } from './openapi-document'

describe('path-item', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof PathItemObjectSchema>>
      type TypescriptType = RequiredDeep<PathItemObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid path item object correctly', () => {
      const validInput = {
        summary: 'Pet operations',
        description: 'Operations for managing pets',
        get: {
          description: 'Returns all pets from the system',
          responses: {
            '200': {
              description: 'A list of pets.',
              content: {
                'application/json': {
                  schema: {
                    type: 'array',
                    items: {
                      type: 'object',
                    },
                  },
                },
              },
            },
          },
        },
        post: {
          description: 'Create a new pet',
          requestBody: {
            required: true,
            content: {
              'application/json': {
                schema: {
                  type: 'object',
                },
              },
            },
          },
          responses: {
            '201': {
              description: 'Pet created successfully.',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                  },
                },
              },
            },
          },
        },
        parameters: [
          {
            name: 'api_key',
            in: 'header',
            required: false,
            schema: {
              type: 'string',
            },
          },
        ],
        servers: [
          {
            url: 'https://petstore.swagger.io/v2',
          },
        ],
      }

      const result = coerceValue(PathItemObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('handles path item object with minimal properties', () => {
      const validInput = {
        get: {
          responses: {
            '200': {
              description: 'Success',
            },
          },
        },
      }

      const result = coerceValue(PathItemObjectSchema, validInput)

      // Should work with minimal valid properties
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(PathItemObjectSchema, invalidInput)).toBe(false)
    })
  })
})
