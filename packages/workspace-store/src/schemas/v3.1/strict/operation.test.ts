import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type OperationObject, OperationObjectSchema } from './openapi-document'

describe('operation', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof OperationObjectSchema>>
      type TypescriptType = RequiredDeep<OperationObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid operation object with basic fields correctly', () => {
      const validInput = {
        summary: 'Get user information',
        description: 'Retrieves user information by ID',
        operationId: 'getUser',
        tags: ['users'],
        deprecated: false,
      }

      const result = coerceValue(OperationObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid operation object with parameters and responses correctly', () => {
      const validInput = {
        operationId: 'createUser',
        summary: 'Create a new user',
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: {
              type: 'string',
            },
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: {
                    type: 'string',
                  },
                  email: {
                    type: 'string',
                  },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'User created successfully',
          },
        },
      }

      const result = coerceValue(OperationObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('parses valid operation object with security and servers correctly', () => {
      const validInput = {
        operationId: 'getSecureData',
        security: [
          {
            apiKey: [],
          },
        ],
        servers: [
          {
            url: 'https://api.example.com/v2',
          },
        ],
      }

      const result = coerceValue(OperationObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual(validInput)
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(OperationObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when operationId is not a string', () => {
      const invalidInput = {
        operationId: 123,
      }

      // Should fail validation since operationId must be a string
      expect(Value.Check(OperationObjectSchema, invalidInput)).toBe(false)
    })
  })
})
