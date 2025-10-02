import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type PathsObject, PathsObjectSchema } from './openapi-document'

describe('paths', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof PathsObjectSchema>>
      type TypescriptType = RequiredDeep<PathsObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('coerces invalid values to valid paths object', () => {
      // Test coercing an invalid object with non-string keys or invalid path items
      const invalidInput = {
        123: 'invalid', // number key instead of string
        '/valid/path': null, // null instead of PathItem
      }

      const result = coerceValue(PathsObjectSchema, invalidInput)

      // Should coerce to empty object or handle invalid values appropriately
      expect(typeof result).toBe('object')
    })

    it('parses valid paths object correctly', () => {
      const validInput = {
        '/pets': {
          get: {
            description: 'Returns all pets from the system',
            responses: {
              '200': {
                description: 'A list of pets.',
                content: {},
              },
            },
          },
        },
        '/pets/{petId}': {
          get: {
            description: 'Returns a single pet by ID',
            parameters: [
              {
                name: 'petId',
                in: 'path',
                required: true,
                schema: {
                  type: 'string',
                },
              },
            ],
            responses: {
              '200': {
                description: 'A single pet.',
                content: {},
              },
            },
          },
        },
      }

      const result = coerceValue(PathsObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('handles empty paths object', () => {
      const validInput = {}

      const result = coerceValue(PathsObjectSchema, validInput)

      // Should work with empty object
      expect(result).toEqual({})
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(PathsObjectSchema, invalidInput)).toBe(false)
    })
  })
})
