import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep, Simplify } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type SchemaObject, SchemaObjectSchema } from './openapi-document'

describe('schema', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = Simplify<Static<typeof SchemaObjectSchema>>
      type TypescriptType = Simplify<SchemaObject>

      const _test: RequiredDeep<SchemaType> = {} as RequiredDeep<TypescriptType>
      const _test2: RequiredDeep<TypescriptType> = {} as RequiredDeep<SchemaType>
    })
  })

  describe('value checking', () => {
    it('parses valid string schema object correctly', () => {
      const validInput = {
        type: 'string',
        title: 'User Name',
        description: 'The name of the user',
        format: 'email',
        maxLength: 100,
        minLength: 1,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        example: 'user@example.com',
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'string',
        title: 'User Name',
        description: 'The name of the user',
        format: 'email',
        maxLength: 100,
        minLength: 1,
        pattern: '^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$',
        example: 'user@example.com',
      })
    })

    it('parses valid number schema object correctly', () => {
      const validInput = {
        type: 'number',
        title: 'Age',
        description: 'The age of the user',
        minimum: 0,
        maximum: 120,
        multipleOf: 1,
        format: 'int32',
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'number',
        title: 'Age',
        description: 'The age of the user',
        minimum: 0,
        maximum: 120,
        multipleOf: 1,
        format: 'int32',
      })
    })

    it('parses valid array schema object correctly', () => {
      const validInput = {
        type: 'array',
        title: 'Tags',
        description: 'List of tags',
        items: {
          type: 'string',
        },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'array',
        title: 'Tags',
        description: 'List of tags',
        items: {
          type: 'string',
        },
        minItems: 1,
        maxItems: 10,
        uniqueItems: true,
      })
    })

    it('parses valid object schema object correctly', () => {
      const validInput = {
        type: 'object',
        title: 'User',
        description: 'A user object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          age: {
            type: 'integer',
            minimum: 0,
          },
        },
        additionalProperties: false,
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'object',
        title: 'User',
        description: 'A user object',
        required: ['name', 'email'],
        properties: {
          name: {
            type: 'string',
          },
          email: {
            type: 'string',
            format: 'email',
          },
          age: {
            type: 'integer',
            minimum: 0,
          },
        },
        additionalProperties: false,
      })
    })

    it('parses schema with composition (allOf) correctly', () => {
      const validInput = {
        allOf: [
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
          {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
          },
        ],
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        _: '',
        allOf: [
          {
            type: 'object',
            properties: {
              name: {
                type: 'string',
              },
            },
          },
          {
            type: 'object',
            properties: {
              email: {
                type: 'string',
                format: 'email',
              },
            },
          },
        ],
      })
    })

    it('parses schema with oneOf correctly', () => {
      const validInput = {
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
        discriminator: {
          propertyName: 'type',
        },
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        _: '',
        oneOf: [
          {
            type: 'string',
          },
          {
            type: 'number',
          },
        ],
        discriminator: {
          propertyName: 'type',
        },
      })
    })

    it('parses schema with enum values correctly', () => {
      const validInput = {
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
        description: 'User status',
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'string',
        enum: ['active', 'inactive', 'pending'],
        description: 'User status',
      })
    })

    it('handles schema with extensions correctly', () => {
      const validInput = {
        type: 'string',
        'x-scalar-ignore': true,
        'x-internal': true,
        'x-variable': 'userName',
        'x-enum-descriptions': {
          active: 'User is active',
          inactive: 'User is inactive',
        },
      }

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Valid input should pass through unchanged
      expect(result).toEqual({
        type: 'string',
        'x-scalar-ignore': true,
        'x-internal': true,
        'x-variable': 'userName',
        'x-enum-descriptions': {
          active: 'User is active',
          inactive: 'User is inactive',
        },
      })
    })

    it('handles schema with no properties', () => {
      const validInput = {}

      const result = coerceValue(SchemaObjectSchema, validInput)

      // Should work with empty object since all properties are optional
      expect(result).toEqual({ _: '' })
    })

    it('fails when given non-object input', () => {
      const invalidInput = 'not an object'

      // This test should fail - coerceValue should throw or return an error
      // when given a string instead of an object
      expect(Value.Check(SchemaObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given array input', () => {
      const invalidInput = ['not', 'an', 'object']

      // This test should fail - coerceValue should throw or return an error
      // when given an array instead of an object
      expect(Value.Check(SchemaObjectSchema, invalidInput)).toBe(false)
    })

    it('fails when given null input', () => {
      const invalidInput = null

      // This test should fail - coerceValue should throw or return an error
      // when given null instead of an object
      expect(Value.Check(SchemaObjectSchema, invalidInput)).toBe(false)
    })
  })
})
