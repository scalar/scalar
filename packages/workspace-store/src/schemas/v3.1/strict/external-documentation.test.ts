import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ExternalDocumentationObject, ExternalDocumentationObjectSchema } from './openapi-document'

describe('external-documentation', () => {
  describe('strict type checking', () => {
    describe('strict type checking', () => {
      it('performs deep type checking on all nested properties', () => {
        type SchemaType = RequiredDeep<Static<typeof ExternalDocumentationObjectSchema>>
        type TypescriptType = RequiredDeep<ExternalDocumentationObject>

        const _test: SchemaType = {} as TypescriptType
        const _test2: TypescriptType = {} as SchemaType
      })
    })

    describe('value checking', () => {
      it('parses valid external documentation object correctly', () => {
        const validInput = {
          url: 'https://example.com/docs',
          description: 'Find more info here',
        }

        const result = coerceValue(ExternalDocumentationObjectSchema, validInput)

        // Valid input should pass through unchanged
        expect(result).toEqual({
          url: 'https://example.com/docs',
          description: 'Find more info here',
        })
      })

      it('handles external documentation object with only required url', () => {
        const validInput = {
          url: 'https://example.com/docs',
        }

        const result = coerceValue(ExternalDocumentationObjectSchema, validInput)

        // Should work with only the required field
        expect(result).toEqual({
          url: 'https://example.com/docs',
        })
      })

      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'

        // This test should fail - coerceValue should throw or return an error
        // when given a string instead of an object
        expect(Value.Check(ExternalDocumentationObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
