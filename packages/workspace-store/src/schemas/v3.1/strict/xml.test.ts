import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type XMLObject, XMLObjectSchema } from './openapi-document'

describe('xml', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof XMLObjectSchema>>
      type TypescriptType = RequiredDeep<XMLObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid XML object with all properties correctly', () => {
      const validInput = {
        name: 'book',
        namespace: 'http://example.com/schema',
        prefix: 'bk',
        attribute: true,
        wrapped: false,
      }

      const result = coerceValue(XMLObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        name: 'book',
        namespace: 'http://example.com/schema',
        prefix: 'bk',
        attribute: true,
        wrapped: false,
      })
    })

    it('parses valid XML object with minimal properties correctly', () => {
      const validInput = {
        name: 'item',
      }

      const result = coerceValue(XMLObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        name: 'item',
      })
    })

    it('handles empty XML object correctly', () => {
      const validInput = {}

      const result = coerceValue(XMLObjectSchema, validInput)

      // Should work with empty object since all properties are optional
      expect(result).toEqual({})
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(XMLObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given null input', () => {
      const invalidInput = null

      // This test should fail - coerceValue should throw or return an error
      // when given null instead of an object
      expect(Value.Check(XMLObjectSchema, invalidInput)).toBe(false)
    })
  })
})
