import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ContactObject, ContactObjectSchema } from './openapi-document'

describe('contact', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof ContactObjectSchema>>
      type TypescriptType = RequiredDeep<ContactObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('coerces invalid values to valid contact object', () => {
      // Test coercing an invalid object with non-string values
      const invalidInput = {
        name: 123, // number instead of string
        url: true, // boolean instead of string
        email: null, // null instead of string
      }

      const result = coerceValue(ContactObjectSchema, invalidInput)

      // All values should be coerced to empty strings since they're optional strings
      expect(result).toEqual({
        name: '',
        url: '',
        email: '',
      })
    })

    it('parses valid contact object correctly', () => {
      const validInput = {
        name: 'API Support Team',
        url: 'https://example.com/contact',
        email: 'support@example.com',
      }

      const result = coerceValue(ContactObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        name: 'API Support Team',
        url: 'https://example.com/contact',
        email: 'support@example.com',
      })
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ContactObjectSchema, invalidInput)).toBe(false)
    })
  })
})
