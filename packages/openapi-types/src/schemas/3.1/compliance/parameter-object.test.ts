import { describe, expect, it } from 'vitest'

import { ParameterObjectSchema } from '../unprocessed/parameter-object'

describe('parameter-object', () => {
  describe('ParameterObjectSchema', () => {
    // https://github.com/OAI/OpenAPI-Specification/blob/main/versions/3.1.1.md#parameter-object-examples
    describe('Parameter Object Examples', () => {
      it('A header parameter with an array of 64-bit integer numbers', () => {
        const result = ParameterObjectSchema.parse({
          name: 'token',
          in: 'header',
          description: 'token to be passed as a header',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'integer',
              format: 'int64',
            },
          },
          style: 'simple',
        })

        expect(result).toEqual({
          name: 'token',
          in: 'header',
          description: 'token to be passed as a header',
          required: true,
          schema: {
            type: 'array',
            items: {
              type: 'integer',
              format: 'int64',
            },
          },
          style: 'simple',
        })
      })

      it('A path parameter of a string value', () => {
        const result = ParameterObjectSchema.parse({
          name: 'username',
          in: 'path',
          description: 'username to fetch',
          required: true,
          schema: {
            type: 'string',
          },
        })

        expect(result).toEqual({
          name: 'username',
          in: 'path',
          description: 'username to fetch',
          required: true,
          schema: {
            type: 'string',
          },
        })
      })

      it('An optional query parameter of a string value, allowing multiple values by repeating the query parameter', () => {
        const result = ParameterObjectSchema.parse({
          name: 'id',
          in: 'query',
          description: 'ID of the object to fetch',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        })

        expect(result).toEqual({
          name: 'id',
          in: 'query',
          description: 'ID of the object to fetch',
          required: false,
          schema: {
            type: 'array',
            items: {
              type: 'string',
            },
          },
          style: 'form',
          explode: true,
        })
      })

      it('A free-form query parameter, allowing undefined parameters of a specific type', () => {
        const result = ParameterObjectSchema.parse({
          in: 'query',
          name: 'freeForm',
          schema: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
          },
          style: 'form',
        })

        expect(result).toEqual({
          in: 'query',
          name: 'freeForm',
          schema: {
            type: 'object',
            additionalProperties: {
              type: 'integer',
            },
          },
          style: 'form',
        })
      })

      it('A complex parameter using content to define serialization', () => {
        const result = ParameterObjectSchema.parse({
          in: 'query',
          name: 'coordinates',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lat', 'long'],
                properties: {
                  lat: {
                    type: 'number',
                  },
                  long: {
                    type: 'number',
                  },
                },
              },
            },
          },
        })

        expect(result).toEqual({
          in: 'query',
          name: 'coordinates',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                required: ['lat', 'long'],
                properties: {
                  lat: {
                    type: 'number',
                  },
                  long: {
                    type: 'number',
                  },
                },
              },
            },
          },
        })
      })
    })
  })
})
