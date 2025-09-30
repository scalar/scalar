import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type HeaderObject, HeaderObjectSchema } from './openapi-document'

describe('header', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof HeaderObjectSchema>>
      type TypescriptType = RequiredDeep<HeaderObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid header object with schema correctly', () => {
      const validInput = {
        description: 'The number of allowed requests in the current period',
        required: false,
        schema: {
          type: 'integer',
        },
      }

      const result = coerceValue(HeaderObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        description: 'The number of allowed requests in the current period',
        required: false,
        schema: {
          type: 'integer',
        },
      })
    })

    it('parses valid header object with content correctly', () => {
      const validInput = {
        description: 'A complex header value',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                },
                text: {
                  type: 'string',
                },
              },
            },
          },
        },
      }

      const result = coerceValue(HeaderObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        description: 'A complex header value',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                code: {
                  type: 'integer',
                },
                text: {
                  type: 'string',
                },
              },
            },
          },
        },
      })
    })

    it('handles header object with no properties', () => {
      const validInput = {}

      const result = coerceValue(HeaderObjectSchema, validInput)

      // Should work with empty object since all properties are optional
      expect(result).toEqual({})
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(HeaderObjectSchema, invalidInput)).toBe(false)
    })
  })
})
