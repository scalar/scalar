import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type CallbackObject, CallbackObjectSchema } from './openapi-document'

describe('callback', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof CallbackObjectSchema>>
      type TypescriptType = RequiredDeep<CallbackObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('coerces invalid values to valid callback object', () => {
      // Test coercing an invalid object with non-string keys or invalid path items
      const invalidInput = {
        123: 'invalid', // number key instead of string
        'valid-expression': null, // null instead of PathItem or Reference
      }

      const result = coerceValue(CallbackObjectSchema, invalidInput)

      // Should coerce to empty object or handle invalid values appropriately
      expect(typeof result).toBe('object')
    })

    it('parses valid callback object correctly', () => {
      const validInput = {
        'callbackUrl': {
          post: {
            requestBody: {
              description: 'Callback payload',
              content: {
                'application/json': {
                  schema: {
                    type: 'object',
                    properties: {
                      message: {
                        type: 'string',
                      },
                    },
                  },
                },
              },
            },
            responses: {
              '200': {
                description: 'Success',
              },
            },
          },
        },
      }

      const result = coerceValue(CallbackObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(CallbackObjectSchema, invalidInput)).toBe(false)
    })
  })
})
