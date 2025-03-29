import { describe, expect, it } from 'vitest'

import { ResponseObjectSchema } from '../unprocessed/response-object'

describe('response-object', () => {
  describe('ContactObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#response-object-examples
    describe('Response Object Example', () => {
      it('Response of an array of a complex type', () => {
        const result = ResponseObjectSchema.parse({
          description: 'A complex object array response',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ComplexObject',
                },
              },
            },
          },
        })

        expect(result).toEqual({
          description: 'A complex object array response',
          content: {
            'application/json': {
              schema: {
                type: 'array',
                items: {
                  $ref: '#/components/schemas/ComplexObject',
                },
              },
            },
          },
        })
      })

      it('Response with a string type', () => {
        const result = ResponseObjectSchema.parse({
          description: 'A simple string response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        })

        expect(result).toEqual({
          description: 'A simple string response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
            },
          },
        })
      })

      it('Plain text response with headers', () => {
        const result = ResponseObjectSchema.parse({
          description: 'A simple string response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
              example: 'whoa!',
            },
          },
          headers: {
            'X-Rate-Limit-Limit': {
              description: 'The number of allowed requests in the current period',
              schema: {
                type: 'integer',
              },
            },
            'X-Rate-Limit-Remaining': {
              description: 'The number of remaining requests in the current period',
              schema: {
                type: 'integer',
              },
            },
            'X-Rate-Limit-Reset': {
              description: 'The number of seconds left in the current period',
              schema: {
                type: 'integer',
              },
            },
          },
        })

        expect(result).toEqual({
          description: 'A simple string response',
          content: {
            'text/plain': {
              schema: {
                type: 'string',
              },
              example: 'whoa!',
            },
          },
          headers: {
            'X-Rate-Limit-Limit': {
              description: 'The number of allowed requests in the current period',
              schema: {
                type: 'integer',
              },
            },
            'X-Rate-Limit-Remaining': {
              description: 'The number of remaining requests in the current period',
              schema: {
                type: 'integer',
              },
            },
            'X-Rate-Limit-Reset': {
              description: 'The number of seconds left in the current period',
              schema: {
                type: 'integer',
              },
            },
          },
        })
      })

      it('Response with no return value', () => {
        const result = ResponseObjectSchema.parse({
          description: 'object created',
        })

        expect(result).toEqual({
          description: 'object created',
        })
      })
    })
  })
})
