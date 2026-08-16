import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type SecurityRequirementObject, SecurityRequirementObjectSchema } from './openapi-document'

describe('security-requirement', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof SecurityRequirementObjectSchema>>
      type TypescriptType = RequiredDeep<SecurityRequirementObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid security requirement with single scheme and scopes correctly', () => {
      const validInput = {
        apiKey: ['read', 'write'],
      }

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({
        apiKey: ['read', 'write'],
      })
    })

    it('parses valid security requirement with multiple schemes correctly', () => {
      const validInput = {
        apiKey: ['read'],
        oauth2: ['admin', 'user'],
        openIdConnect: ['profile', 'email'],
      }

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({
        apiKey: ['read'],
        oauth2: ['admin', 'user'],
        openIdConnect: ['profile', 'email'],
      })
    })

    it('parses valid security requirement with empty scopes array correctly', () => {
      const validInput = {
        apiKey: [],
        oauth2: [],
      }

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({
        apiKey: [],
        oauth2: [],
      })
    })

    it('parses valid security requirement with single scope correctly', () => {
      const validInput = {
        basicAuth: ['admin'],
      }

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({
        basicAuth: ['admin'],
      })
    })

    it('parses empty security requirement object (anonymous access) correctly', () => {
      const validInput = {}

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({})
    })

    it('parses valid security requirement with complex scopes correctly', () => {
      const validInput = {
        oauth2: ['read:users', 'write:users', 'delete:users', 'admin:all'],
      }

      const result = coerceValue(SecurityRequirementObjectSchema, validInput)

      expect(result).toEqual({
        oauth2: ['read:users', 'write:users', 'delete:users', 'admin:all'],
      })
    })

    describe('invalid inputs', () => {
      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'
        expect(Value.Check(SecurityRequirementObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given null input', () => {
        const invalidInput = null
        expect(Value.Check(SecurityRequirementObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
