import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type TagObject, TagObjectSchema } from './openapi-document'

describe('tag', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof TagObjectSchema>>
      type TypescriptType = RequiredDeep<TagObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid tag object with all properties correctly', () => {
      const validInput = {
        name: 'Pets',
        description: 'Everything about pets',
        externalDocs: {
          description: 'Find more info here',
          url: 'https://example.com/docs',
        },
      }

      const result = coerceValue(TagObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        name: 'Pets',
        description: 'Everything about pets',
        externalDocs: {
          description: 'Find more info here',
          url: 'https://example.com/docs',
        },
      })
    })

    it('parses valid tag object with minimal properties correctly', () => {
      const validInput = {
        name: 'Users',
      }

      const result = coerceValue(TagObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        name: 'Users',
      })
    })

    it('fails when given empty object', () => {
      const invalidInput = {}

      // This test should fail - coerceValue should throw or return an error
      // when given an empty object since name is required
      expect(Value.Check(TagObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(TagObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given null input', () => {
      const invalidInput = null

      // This test should fail - coerceValue should throw or return an error
      // when given null instead of an object
      expect(Value.Check(TagObjectSchema, invalidInput)).toBe(false)
    })
  })
})
