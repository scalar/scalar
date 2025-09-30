import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type MediaTypeObject, MediaTypeObjectSchema } from './openapi-document'

describe('media-type', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof MediaTypeObjectSchema>>
      type TypescriptType = RequiredDeep<MediaTypeObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid media type object with schema correctly', () => {
      const validInput = {
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'string',
            },
            name: {
              type: 'string',
            },
          },
        },
      }

      const result = coerceValue(MediaTypeObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid media type object with example correctly', () => {
      const validInput = {
        schema: {
          type: 'object',
          properties: {
            id: {
              type: 'integer',
            },
            name: {
              type: 'string',
            },
          },
        },
        example: {
          id: 123,
          name: 'John Doe',
        },
      }

      const result = coerceValue(MediaTypeObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid media type object with examples correctly', () => {
      const validInput = {
        schema: {
          type: 'string',
        },
        examples: {
          default: {
            value: 'example string',
          },
          alternative: {
            value: 'another example',
          },
        },
      }

      const result = coerceValue(MediaTypeObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid media type object with encoding correctly', () => {
      const validInput = {
        schema: {
          type: 'object',
          properties: {
            file: {
              type: 'string',
              format: 'binary',
            },
          },
        },
        encoding: {
          file: {
            contentType: 'application/octet-stream',
          },
        },
      }

      const result = coerceValue(MediaTypeObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(MediaTypeObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when schema is not a valid schema object', () => {
      const invalidInput = {
        schema: 'not a schema object',
      }

      // Should fail validation since schema must be a schema object
      expect(Value.Check(MediaTypeObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when examples is not an object', () => {
      const invalidInput = {
        examples: 'not an object',
      }

      // Should fail validation since examples must be an object
      expect(Value.Check(MediaTypeObjectSchema, invalidInput)).toBe(false)
    })
  })
})
