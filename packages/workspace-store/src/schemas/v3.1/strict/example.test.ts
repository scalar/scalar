import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ExampleObject, ExampleObjectSchema } from './openapi-document'

describe('example', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof ExampleObjectSchema>>
      type TypescriptType = RequiredDeep<ExampleObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid example object correctly', () => {
      const validInput = {
        summary: 'A pet example',
        description: 'An example of a pet with name and tag',
        value: {
          name: 'Fluffy',
          tag: 'dog',
        },
      }

      const result = coerceValue(ExampleObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        summary: 'A pet example',
        description: 'An example of a pet with name and tag',
        value: {
          name: 'Fluffy',
          tag: 'dog',
        },
      })
    })

    it('handles example object with externalValue', () => {
      const validInput = {
        summary: 'External example',
        externalValue: 'https://example.com/examples/pet.json',
      }

      const result = coerceValue(ExampleObjectSchema, validInput)

      // Should work with externalValue instead of value
      expect(result).toEqual({
        summary: 'External example',
        externalValue: 'https://example.com/examples/pet.json',
      })
    })

    it('handles example object with no properties', () => {
      const validInput = {}

      const result = coerceValue(ExampleObjectSchema, validInput)

      // Should work with empty object since all properties are optional
      expect(result).toEqual({})
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ExampleObjectSchema, invalidInput)).toBe(false)
    })
  })
})
