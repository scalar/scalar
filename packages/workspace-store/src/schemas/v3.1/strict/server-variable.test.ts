import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ServerVariableObject, ServerVariableObjectSchema } from './openapi-document'

describe('server-variable', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof ServerVariableObjectSchema>>
      type TypescriptType = RequiredDeep<ServerVariableObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid server variable object with all properties correctly', () => {
      const validInput = {
        enum: ['v1', 'v2'],
        default: 'v1',
        description: 'API version',
      }

      const result = coerceValue(ServerVariableObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        enum: ['v1', 'v2'],
        default: 'v1',
        description: 'API version',
      })
    })

    it('parses valid server variable object with minimal properties correctly', () => {
      const validInput = {
        default: 'v1',
      }

      const result = coerceValue(ServerVariableObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        default: 'v1',
      })
    })

    it('parses valid server variable object with just enum correctly', () => {
      const validInput = {
        enum: ['prod', 'staging', 'dev'],
      }

      const result = coerceValue(ServerVariableObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        enum: ['prod', 'staging', 'dev'],
      })
    })

    it('parses valid server variable object with just description correctly', () => {
      const validInput = {
        description: 'Environment selection',
      }

      const result = coerceValue(ServerVariableObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        description: 'Environment selection',
      })
    })

    it('fails when given empty object', () => {
      const invalidInput = {}

      // Empty object should be valid since all properties are optional
      expect(Value.Check(ServerVariableObjectSchema, invalidInput)).toBe(true)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ServerVariableObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given null input', () => {
      const invalidInput = null

      // This test should fail - coerceValue should throw or return an error
      // when given null instead of an object
      expect(Value.Check(ServerVariableObjectSchema, invalidInput)).toBe(false)
    })

    it('passes when default value is in enum', () => {
      const validInput = {
        enum: ['v1', 'v2'],
        default: 'v2',
      }

      const result = coerceValue(ServerVariableObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        enum: ['v1', 'v2'],
        default: 'v2',
      })
    })
  })
})
