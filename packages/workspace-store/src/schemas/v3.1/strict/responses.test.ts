import type { Static } from '@scalar/typebox'
import { Value } from '@scalar/typebox/value'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { type ResponsesObject, ResponsesObjectSchema } from './openapi-document'

describe('responses', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all schemas', () => {
      type SchemaType = RequiredDeep<Static<typeof ResponsesObjectSchema>>
      type TypescriptType = RequiredDeep<ResponsesObject>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
    })
  })

  describe('value checking', () => {
    it('parses valid responses with single status code correctly', () => {
      const validInput = {
        '200': {
          description: 'Success response',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validInput)

      expect(result).toEqual({
        '200': {
          description: 'Success response',
        },
      })
    })

    it('parses valid responses with multiple status codes correctly', () => {
      const validInput = {
        '200': {
          description: 'Success response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
          },
        },
        '404': {
          description: 'Not found',
        },
        '500': {
          description: 'Internal server error',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validInput)

      expect(result).toEqual({
        '200': {
          description: 'Success response',
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  id: { type: 'string' },
                },
              },
            },
          },
        },
        '404': {
          description: 'Not found',
        },
        '500': {
          description: 'Internal server error',
        },
      })
    })

    it('parses valid responses with default response correctly', () => {
      const validInput = {
        '200': {
          description: 'Success response',
        },
        default: {
          description: 'Default response',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validInput)

      expect(result).toEqual({
        '200': {
          description: 'Success response',
        },
        default: {
          description: 'Default response',
        },
      })
    })

    it('parses valid responses with reference objects correctly', () => {
      const validInput = {
        '200': {
          $ref: '#/components/responses/SuccessResponse',
        },
        '404': {
          description: 'Not found',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validInput)

      expect(result).toEqual({
        '200': {
          $ref: '#/components/responses/SuccessResponse',
          '$ref-value': {
            description: '',
          },
        },
        '404': {
          description: 'Not found',
        },
      })
    })

    it('parses valid responses with complex status codes correctly', () => {
      const validInput = {
        '2XX': {
          description: 'Any 2xx response',
        },
        '4XX': {
          description: 'Any 4xx response',
        },
        '5XX': {
          description: 'Any 5xx response',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validInput)

      expect(result).toEqual({
        '2XX': {
          description: 'Any 2xx response',
        },
        '4XX': {
          description: 'Any 4xx response',
        },
        '5XX': {
          description: 'Any 5xx response',
        },
      })
    })

    describe('invalid inputs', () => {
      it('fails when given non-object input', () => {
        const invalidInput = 'not an object'

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given null input', () => {
        const invalidInput = null

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when given array input', () => {
        const invalidInput = [
          {
            '200': {
              description: 'Success',
            },
          },
        ]

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when response value is not an object', () => {
        const invalidInput = {
          '200': 'not an object',
        }

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when response value is null', () => {
        const invalidInput = {
          '200': null,
        }

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when response object is missing required description', () => {
        const invalidInput = {
          '200': {},
        }

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })

      it('fails when response object has invalid description type', () => {
        const invalidInput = {
          '200': {
            description: 123,
          },
        }

        expect(Value.Check(ResponsesObjectSchema, invalidInput)).toBe(false)
      })
    })
  })
})
