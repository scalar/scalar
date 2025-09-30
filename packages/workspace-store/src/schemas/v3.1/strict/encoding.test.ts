import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type EncodingObject, EncodingObjectSchema } from './openapi-document'

describe('encoding', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof EncodingObjectSchema>>
      type TypescriptType = RequiredDeep<EncodingObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid encoding object correctly', () => {
      const validInput = {
        contentType: 'image/png, image/jpeg',
        headers: {
          'X-Rate-Limit-Limit': {
            description: 'The number of allowed requests in the current period',
            schema: {
              type: 'integer',
            },
          },
        },
      }

      const result = coerceValue(EncodingObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        contentType: 'image/png, image/jpeg',
        headers: {
          'X-Rate-Limit-Limit': {
            description: 'The number of allowed requests in the current period',
            schema: {
              type: 'integer',
            },
          },
        },
      })
    })

    it('handles encoding object with no properties', () => {
      const validInput = {}

      const result = coerceValue(EncodingObjectSchema, validInput)

      // Should work with empty object since all properties are optional
      expect(result).toEqual({})
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(EncodingObjectSchema, invalidInput)).toBe(false)
    })
  })
})
