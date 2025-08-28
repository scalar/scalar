import { describe, it, expect } from 'vitest'
import { ResponsesObjectSchema } from './responses'
import { Value } from '@scalar/typebox/value'
import { coerceValue } from '@/schemas/typebox-coerce'

describe('ResponsesObjectSchema', () => {
  describe('valid responses', () => {
    it('should validate a minimal response with just description', () => {
      const validResponse = {
        '200': {
          description: 'Successful operation',
        },
      }

      const result = coerceValue(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })

    it('validates a response with full ResponseObject', () => {
      const validResponse = {
        '200': {
          description: 'Successful operation',
          headers: {
            'X-Rate-Limit': {
              description: 'Rate limit remaining',
              schema: { type: 'integer' },
            },
          },
          content: {
            'application/json': {
              schema: { type: 'object', properties: { name: { type: 'string' } } },
            },
          },
          links: {
            'next': {
              operationId: 'getNextPage',
            },
          },
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })

    it('validates multiple responses', () => {
      const validResponse = {
        '200': {
          description: 'Successful operation',
        },
        '400': {
          description: 'Bad request',
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })

    it('validates response with default key', () => {
      const validResponse = {
        'default': {
          description: 'Unexpected error',
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })

    it('validates response with numeric string keys', () => {
      const validResponse = {
        '201': {
          description: 'Created',
        },
        '422': {
          description: 'Validation error',
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })
  })

  describe('invalid responses', () => {
    it('rejects empty object', () => {
      expect(() => {
        ResponsesObjectSchema.Parse({})
      }).toThrow()
    })

    it('rejects non-object values', () => {
      expect(() => {
        ResponsesObjectSchema.Parse('not an object')
      }).toThrow()

      expect(() => {
        ResponsesObjectSchema.Parse(null)
      }).toThrow()

      expect(() => {
        ResponsesObjectSchema.Parse(undefined)
      }).toThrow()
    })

    it('rejects invalid response object', () => {
      const invalidResponse = {
        '200': {
          invalidField: 'this should not be here',
        },
      }

      expect(() => {
        ResponsesObjectSchema.Parse(invalidResponse)
      }).toThrow()
    })

    it('rejects invalid reference object', () => {
      const invalidResponse = {
        '404': {
          $ref: 123, // should be string
        },
      }

      expect(() => {
        ResponsesObjectSchema.Parse(invalidResponse)
      }).toThrow()
    })

    it('rejects mixed valid/invalid responses', () => {
      const invalidResponse = {
        '200': {
          description: 'Valid response',
        },
        '400': 'not a valid response object',
      }

      expect(() => {
        ResponsesObjectSchema.Parse(invalidResponse)
      }).toThrow()
    })

    it('rejects response with non-string keys', () => {
      const invalidResponse = {
        200: {
          // should be string '200'
          description: 'Successful operation',
        },
      }

      expect(() => {
        ResponsesObjectSchema.Parse(invalidResponse)
      }).toThrow()
    })
  })

  describe('edge cases', () => {
    it('handles very long response descriptions', () => {
      const longDescription = 'A'.repeat(1000)
      const validResponse = {
        '200': {
          description: longDescription,
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result['200']?.description).toBe(longDescription)
    })

    it('handles special characters in response keys', () => {
      const validResponse = {
        '2XX': {
          description: 'Success response',
        },
        '4XX': {
          description: 'Client error',
        },
        '5XX': {
          description: 'Server error',
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })

    it('handles empty string keys (though not recommended)', () => {
      const validResponse = {
        '': {
          description: 'Empty key response',
        },
      }

      const result = Value.Parse(ResponsesObjectSchema, validResponse)
      expect(result).toEqual(validResponse)
    })
  })

  describe('type inference', () => {
    it('correctly infers ResponsesObject type', () => {
      const response = {
        '200': {
          description: 'Success',
        },
      }

      // This should compile without type errors
      expect(typeof response).toBe('object')
      expect(response['200']?.description).toBe('Success')
    })

    it('allows mixed ResponseObject and ReferenceObject', () => {
      const mixedResponse = {
        '200': {
          description: 'Success',
        },
        '404': {
          $ref: '#/components/responses/NotFound',
        },
      }

      expect(mixedResponse['200']?.description).toBe('Success')
      expect(mixedResponse['404'] && '$ref' in mixedResponse['404'] ? mixedResponse['404'].$ref : undefined).toBe(
        '#/components/responses/NotFound',
      )
    })
  })
})
