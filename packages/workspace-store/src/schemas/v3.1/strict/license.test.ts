import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type LicenseObject, LicenseObjectSchema } from './openapi-document'

describe('license', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof LicenseObjectSchema>>
      type TypescriptType = RequiredDeep<LicenseObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid license object with name correctly', () => {
      const validInput = {
        name: 'MIT',
      }

      const result = coerceValue(LicenseObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid license object with identifier correctly', () => {
      const validInput = {
        name: 'Apache 2.0',
        identifier: 'Apache-2.0',
      }

      const result = coerceValue(LicenseObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid license object with url correctly', () => {
      const validInput = {
        name: 'BSD 3-Clause',
        url: 'https://opensource.org/licenses/BSD-3-Clause',
      }

      const result = coerceValue(LicenseObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid license object with all fields correctly', () => {
      const validInput = {
        name: 'Custom License',
        identifier: 'Custom-1.0',
        url: 'https://example.com/license',
      }

      const result = coerceValue(LicenseObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses empty license object correctly', () => {
      const validInput = {}

      const result = coerceValue(LicenseObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(LicenseObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when name is not a string', () => {
      const invalidInput = {
        name: 123,
      }

      // Should fail validation since name must be a string
      expect(Value.Check(LicenseObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when identifier is not a string', () => {
      const invalidInput = {
        identifier: true,
      }

      // Should fail validation since identifier must be a string
      expect(Value.Check(LicenseObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when url is not a string', () => {
      const invalidInput = {
        url: ['not', 'a', 'string'],
      }

      // Should fail validation since url must be a string
      expect(Value.Check(LicenseObjectSchema, invalidInput)).toBe(false)
    })
  })
})
