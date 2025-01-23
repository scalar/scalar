import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { describe, expect, expectTypeOf, it } from 'vitest'

import { oasRequestSchema } from './requests'

describe('oasRequestSchema', () => {
  it('validates a minimal request', () => {
    const minimalRequest = {}
    expect(() => oasRequestSchema.parse(minimalRequest)).not.toThrow()
  })

  it('validates a complete request', () => {
    const completeRequest = {
      tags: ['pet'],
      summary: 'Add a new pet',
      description: 'Add a new pet to the store',
      operationId: 'addPet',
      security: [{ apiKey: [] }, { oauth2: ['write:pets'] }],
      requestBody: {
        description: 'Pet object that needs to be added to the store',
        content: {
          'application/json': {
            schema: {
              type: 'object',
            },
          },
        },
      },
      parameters: [
        {
          name: 'petId',
          in: 'path',
          description: 'ID of pet',
          required: true,
          schema: {
            type: 'integer',
            format: 'int64',
          },
        },
      ],
      externalDocs: {
        description: 'Find more info here',
        url: 'https://example.com',
      },
      deprecated: false,
      responses: {
        '200': {
          description: 'successful operation',
        },
      },
    }

    expect(() => oasRequestSchema.parse(completeRequest)).not.toThrow()
  })

  describe('security field', () => {
    it('accepts an empty array', () => {
      const request = {
        security: [],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('accepts single security requirement', () => {
      const request = {
        security: [{ apiKey: [] }],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('accepts multiple security requirements (OR)', () => {
      const request = {
        security: [{ apiKey: [] }, { oauth2: ['read', 'write'] }],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('accepts complex security requirements (AND)', () => {
      const request = {
        security: [
          {
            apiKey: [],
            basicAuth: [],
          },
        ],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('accepts empty object for optional security', () => {
      const request = {
        security: [{}],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('accepts mixed security requirements', () => {
      const request = {
        security: [
          { apiKey: [] },
          { oauth2: ['read', 'write'] },
          {},
          { apiKey: [], basicAuth: [] },
        ],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('parameters field', () => {
    it('validates path parameters', () => {
      const request = {
        parameters: [
          {
            name: 'petId',
            in: 'path',
            required: true,
            schema: { type: 'string' },
          },
        ],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('validates query parameters', () => {
      const request = {
        parameters: [
          {
            name: 'limit',
            in: 'query',
            schema: { type: 'integer' },
          },
        ],
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('x-scalar fields', () => {
    it('validates x-scalar-examples', () => {
      const request = {
        'x-scalar-examples': {
          example1: {
            name: 'Example Request',
            body: {
              encoding: 'application/json',
              content: {
                name: 'test',
                age: 25,
              },
            },
            parameters: {
              path: {
                userId: '123',
                groupId: '456',
              },
              query: {
                limit: '10',
                offset: '0',
              },
              headers: {
                'X-API-Key': 'abc123',
                'Accept': 'application/json',
              },
              cookies: {
                sessionId: 'xyz789',
              },
            },
          },
        },
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('validates x-internal flag', () => {
      const request = {
        'x-internal': true,
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })

    it('validates x-scalar-ignore flag', () => {
      const request = {
        'x-scalar-ignore': true,
      }
      expect(() => oasRequestSchema.parse(request)).not.toThrow()
    })
  })

  describe('validation errors', () => {
    it('rejects invalid tag type', () => {
      const request = {
        tags: [123], // should be strings
      }
      expect(() => oasRequestSchema.parse(request)).toThrow()
    })

    it('rejects invalid security format', () => {
      const request = {
        security: [{ apiKey: 'invalid' }], // should be string array
      }
      expect(() => oasRequestSchema.parse(request)).toThrow()
    })

    it('rejects invalid parameter format', () => {
      const request = {
        parameters: [
          {
            name: 'test',
            // missing required 'in' field
            schema: { type: 'string' },
          },
        ],
      }
      expect(() => oasRequestSchema.parse(request)).toThrow()
    })

    it('checks the output type of the oas schema against OpenAPIV3_1.OperationObject', () => {
      expectTypeOf(
        oasRequestSchema.parse({}),
      ).toMatchTypeOf<OpenAPIV3_1.OperationObject>()
    })
  })
})
