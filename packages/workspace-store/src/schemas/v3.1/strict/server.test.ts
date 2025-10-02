import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ServerObject, ServerObjectSchema } from './openapi-document'

describe('server', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof ServerObjectSchema>>
      type TypescriptType = RequiredDeep<ServerObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid server object with all properties correctly', () => {
      const validInput = {
        url: 'https://api.example.com/v1',
        description: 'Production server',
        variables: {
          version: {
            default: 'v1',
            description: 'API version',
            enum: ['v1', 'v2'],
          },
        },
      }

      const result = coerceValue(ServerObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        url: 'https://api.example.com/v1',
        description: 'Production server',
        variables: {
          version: {
            default: 'v1',
            description: 'API version',
            enum: ['v1', 'v2'],
          },
        },
      })
    })

    it('parses valid server object with minimal properties correctly', () => {
      const validInput = {
        url: 'https://api.example.com',
      }

      const result = coerceValue(ServerObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        url: 'https://api.example.com',
      })
    })

    it('fails when given empty object', () => {
      const invalidInput = {}

      // This test should fail - coerceValue should throw or return an error
      // when given an empty object since url is required
      expect(Value.Check(ServerObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ServerObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given null input', () => {
      const invalidInput = null

      // This test should fail - coerceValue should throw or return an error
      // when given null instead of an object
      expect(Value.Check(ServerObjectSchema, invalidInput)).toBe(false)
    })
  })
})
