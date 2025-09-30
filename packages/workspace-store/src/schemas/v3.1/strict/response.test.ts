import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ResponseObject, ResponseObjectSchema } from './openapi-document'

describe('response', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof ResponseObjectSchema>>
      type TypescriptType = RequiredDeep<ResponseObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid response with minimal required fields correctly', () => {
      const validInput = {
        description: 'Success response',
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Success response',
      })
    })

    it('parses valid response with all fields correctly', () => {
      const validInput = {
        description: 'Success response with content',
        headers: {
          'X-Rate-Limit': {
            description: 'Rate limit information',
            schema: {
              type: 'integer',
            },
          },
          'Content-Type': {
            description: 'Content type header',
            schema: {
              type: 'string',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            example: {
              id: '123',
              name: 'Example Item',
            },
          },
          'text/plain': {
            schema: {
              type: 'string',
            },
            example: 'Plain text response',
          },
        },
        links: {
          self: {
            operationId: 'getItem',
            parameters: {
              itemId: '$response.body#/id',
            },
          },
          related: {
            $ref: '#/components/links/RelatedItems',
          },
        },
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Success response with content',
        headers: {
          'X-Rate-Limit': {
            description: 'Rate limit information',
            schema: {
              type: 'integer',
            },
          },
          'Content-Type': {
            description: 'Content type header',
            schema: {
              type: 'string',
            },
          },
        },
        content: {
          'application/json': {
            schema: {
              type: 'object',
              properties: {
                id: { type: 'string' },
                name: { type: 'string' },
              },
            },
            example: {
              id: '123',
              name: 'Example Item',
            },
          },
          'text/plain': {
            schema: {
              type: 'string',
            },
            example: 'Plain text response',
          },
        },
        links: {
          self: {
            operationId: 'getItem',
            parameters: {
              itemId: '$response.body#/id',
            },
          },
          related: {
            $ref: '#/components/links/RelatedItems',
          },
        },
      })
    })

    it('parses valid response with only headers correctly', () => {
      const validInput = {
        description: 'Response with headers',
        headers: {
          'Cache-Control': {
            description: 'Cache control directives',
            schema: {
              type: 'string',
            },
          },
        },
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Response with headers',
        headers: {
          'Cache-Control': {
            description: 'Cache control directives',
            schema: {
              type: 'string',
            },
          },
        },
      })
    })

    it('parses valid response with only content correctly', () => {
      const validInput = {
        description: 'Response with content',
        content: {
          'application/xml': {
            schema: {
              type: 'string',
            },
          },
        },
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Response with content',
        content: {
          'application/xml': {
            schema: {
              type: 'string',
            },
          },
        },
      })
    })

    it('parses valid response with only links correctly', () => {
      const validInput = {
        description: 'Response with links',
        links: {
          next: {
            operationId: 'getNextPage',
            parameters: {
              page: '$response.body#/nextPage',
            },
          },
        },
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Response with links',
        links: {
          next: {
            operationId: 'getNextPage',
            parameters: {
              page: '$response.body#/nextPage',
            },
          },
        },
      })
    })

    it('parses valid response with reference objects in headers correctly', () => {
      const validInput = {
        description: 'Response with reference headers',
        headers: {
          'Authorization': {
            $ref: '#/components/headers/Authorization',
          },
        },
      }

      const result = coerceValue(ResponseObjectSchema, validInput)

      expect(result).toEqual({
        description: 'Response with reference headers',
        headers: {
          'Authorization': {
            $ref: '#/components/headers/Authorization',
          },
        },
      })
    })

    describe('invalid inputs', () => {
      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given null input', () => {
        const invalidInput = null

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given array input', () => {
        const invalidInput = [
          {
            description: 'Success',
          },
        ]

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when description is missing', () => {
        const invalidInput = {}

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when description is not a string', () => {
        const invalidInput = {
          description: 123,
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when description is null', () => {
        const invalidInput = {
          description: null,
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when headers is not an object', () => {
        const invalidInput = {
          description: 'Success',
          headers: 'not an object',
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when content is not an object', () => {
        const invalidInput = {
          description: 'Success',
          content: 'not an object',
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when links is not an object', () => {
        const invalidInput = {
          description: 'Success',
          links: 'not an object',
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when header value is not an object', () => {
        const invalidInput = {
          description: 'Success',
          headers: {
            'Content-Type': 'not an object',
          },
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when content value is not an object', () => {
        const invalidInput = {
          description: 'Success',
          content: {
            'application/json': 'not an object',
          },
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when link value is not an object', () => {
        const invalidInput = {
          description: 'Success',
          links: {
            self: 'not an object',
          },
        }

        expect(Value.Check(ResponseObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
