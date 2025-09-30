import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type RequestBodyObject, RequestBodyObjectSchema } from './openapi-document'

describe('request-body', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof RequestBodyObjectSchema>>
      type TypescriptType = RequiredDeep<RequestBodyObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid request body with minimal required fields correctly', () => {
      const validInput = {
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      }

      const result = coerceValue(RequestBodyObjectSchema, validInput)

      expect(result).toEqual({
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                name: { type: 'string' },
              },
            },
          },
        },
      })
    })

    it('parses valid request body with all fields correctly', () => {
      const validInput = {
        description: 'User creation request body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                age: { type: 'integer', minimum: 0 },
              },
            },
            example: {
              name: 'John Doe',
              email: 'john@example.com',
              age: 30,
            },
          },
          'application/xml': {
            schema: {
              type: 'string',
            },
          },
        },
        required: true,
      }

      const result = coerceValue(RequestBodyObjectSchema, validInput)

      expect(result).toEqual({
        description: 'User creation request body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
              required: ['name', 'email'],
              properties: {
                name: { type: 'string' },
                email: { type: 'string', format: 'email' },
                age: { type: 'integer', minimum: 0 },
              },
            },
            example: {
              name: 'John Doe',
              email: 'john@example.com',
              age: 30,
            },
          },
          'application/xml': {
            schema: {
              type: 'string',
            },
          },
        },
        required: true,
      })
    })

    it('parses valid request body with optional description omitted correctly', () => {
      const validInput = {
        content: {
          'text/plain': {
            schema: {
              type: 'string',
            },
            example: 'Hello World',
          },
        },
        required: false,
      }

      const result = coerceValue(RequestBodyObjectSchema, validInput)

      expect(result).toEqual({
        content: {
          'text/plain': {
            schema: {
              type: 'string',
            },
            example: 'Hello World',
          },
        },
        required: false,
      })
    })

    it('parses valid request body with required flag omitted (defaults to false) correctly', () => {
      const validInput = {
        description: 'Optional request body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      }

      const result = coerceValue(RequestBodyObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Optional request body',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      })
    })

    it('parses valid request body with multiple content types correctly', () => {
      const validInput = {
        description: 'Multipart form data',
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                },
                metadata: {
                  type: 'object',
                },
              },
            },
          },
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
        required: true,
      }

      const result = coerceValue(RequestBodyObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Multipart form data',
        content: {
          'multipart/form-data': {
            schema: {
              type: 'object',
              properties: {
                file: {
                  type: 'string',
                  format: 'binary',
                },
                metadata: {
                  type: 'object',
                },
              },
            },
          },
          'application/x-www-form-urlencoded': {
            schema: {
              type: 'object',
              properties: {
                title: { type: 'string' },
                description: { type: 'string' },
              },
            },
          },
        },
        required: true,
      })
    })

    describe('invalid inputs', () => {
      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given null input', () => {
        const invalidInput = null

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given array input', () => {
        const invalidInput = [
          {
            content: {
              'application/json': {
                schema: { type: 'object' },
              },
            },
          },
        ]

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when content is missing', () => {
        const invalidInput = {
          description: 'Missing content',
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when content is not an object', () => {
        const invalidInput = {
          content: 'not an object',
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when content value is not an object', () => {
        const invalidInput = {
          content: {
            'application/json': 'not an object',
          },
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when description is not a string', () => {
        const invalidInput = {
          description: 123,
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when required is not a boolean', () => {
        const invalidInput = {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
          required: 'not a boolean',
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when required is null', () => {
        const invalidInput = {
          content: {
            'application/json': {
              schema: { type: 'object' },
            },
          },
          required: null,
        }

        expect(Value.Check(RequestBodyObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
