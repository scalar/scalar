import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ParameterObject, ParameterObjectSchema } from './openapi-document'

describe('parameter', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof ParameterObjectSchema>>
      type TypescriptType = RequiredDeep<ParameterObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses valid parameter object with schema correctly', () => {
      const validInput = {
        name: 'limit',
        in: 'query',
        description: 'Maximum number of results to return',
        required: false,
        schema: {
          type: 'integer',
          minimum: 1,
          maximum: 100,
        },
        example: 10,
      }

      const result = coerceValue(ParameterObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid parameter object with content correctly', () => {
      const validInput = {
        name: 'filter',
        in: 'query',
        description: 'Filter criteria for the results',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                status: {
                  type: 'string',
                  enum: ['active', 'inactive'],
                },
                category: {
                  type: 'string',
                },
              },
            },
          },
        },
      }

      const result = coerceValue(ParameterObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('handles path parameter with required field', () => {
      const validInput = {
        name: 'petId',
        in: 'path',
        description: 'ID of the pet to retrieve',
        required: true,
        schema: {
          type: 'string',
        },
      }

      const result = coerceValue(ParameterObjectSchema, validInput)

      // Should work with path parameter
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(ParameterObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when required fields are missing', () => {
      const invalidInput = {
        description: 'A parameter without name and in',
      }

      // Should fail validation since name and in are required
      expect(Value.Check(ParameterObjectSchema, invalidInput)).toBe(false)
    })
  })
})
