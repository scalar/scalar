import type { Static } from '@scalar/typebox'
import type { IsEqual, Simplify } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'
import type { AssertTrue } from '@/schemas/types'

import { type ContactObject, ContactObjectSchemaDefinition } from './contact'

describe('contact', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = Simplify<Static<typeof ContactObjectSchemaDefinition>>
      type TypescriptType = Simplify<ContactObject>

      // Deep equality check between the types
      type _ = AssertTrue<IsEqual<SchemaType, TypescriptType>>
      type _2 = AssertTrue<IsEqual<TypescriptType, SchemaType>>
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

      const result = coerceValue(ContactObjectSchemaDefinition, invalidInput)

      // All values should be coerced to empty strings since they're optional strings
      expect(result).toEqual({
        name: '',
        url: '',
        email: '',
      })
    })
  })
})
