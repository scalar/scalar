import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type DiscriminatorObject, DiscriminatorObjectSchema } from './openapi-document'

describe('discriminator', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof DiscriminatorObjectSchema>>
      type TypescriptType = RequiredDeep<DiscriminatorObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid discriminator object correctly', () => {
      const validInput = {
        propertyName: 'petType',
        mapping: {
          dog: '#/components/schemas/Dog',
          cat: '#/components/schemas/Cat',
          bird: 'https://example.com/schemas/Bird.yaml',
        },
      }

      const result = coerceValue(DiscriminatorObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        propertyName: 'petType',
        mapping: {
          dog: '#/components/schemas/Dog',
          cat: '#/components/schemas/Cat',
          bird: 'https://example.com/schemas/Bird.yaml',
        },
      })
    })

    it('handles discriminator object with only required propertyName', () => {
      const validInput = {
        propertyName: 'type',
      }

      const result = coerceValue(DiscriminatorObjectSchema, validInput)

      // Should work with only the required field
      expect(result).toEqual({
        propertyName: 'type',
      })
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(DiscriminatorObjectSchema, invalidInput)).toBe(false)
    })
  })
})
