import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type LinkObject, LinkObjectSchema } from './openapi-document'

describe('link', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof LinkObjectSchema>>
      type TypescriptType = RequiredDeep<LinkObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid link object with operationRef correctly', () => {
      const validInput = {
        operationRef: '#/paths/~1users~1{userId}/get',
        description: 'Get user by ID',
      }

      const result = coerceValue(LinkObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid link object with operationId correctly', () => {
      const validInput = {
        operationId: 'getUser',
        description: 'Retrieve user information',
      }

      const result = coerceValue(LinkObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid link object with parameters correctly', () => {
      const validInput = {
        operationId: 'getUserPosts',
        parameters: {
          userId: '$response.body#/id',
          limit: 10,
        },
        description: 'Get posts for the created user',
      }

      const result = coerceValue(LinkObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid link object with requestBody correctly', () => {
      const validInput = {
        operationId: 'createUser',
        requestBody: '$response.body#/user',
        description: 'Create user with response data',
      }

      const result = coerceValue(LinkObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid link object with server correctly', () => {
      const validInput = {
        operationId: 'getData',
        server: {
          url: 'https://api.example.com/v2',
        },
        description: 'Get data from different server',
      }

      const result = coerceValue(LinkObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(LinkObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when operationRef is not a string', () => {
      const invalidInput = {
        operationRef: 123,
      }

      // Should fail validation since operationRef must be a string
      expect(Value.Check(LinkObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when parameters is not an object', () => {
      const invalidInput = {
        operationId: 'getUser',
        parameters: 'not an object',
      }

      // Should fail validation since parameters must be an object
      expect(Value.Check(LinkObjectSchema, invalidInput)).toBe(false)
    })
  })
})
