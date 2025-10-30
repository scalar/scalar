import type { Static } from '@scalar/typebox'
import type { RequiredDeep } from 'type-fest'
import { describe, expect, it } from 'vitest'

import { coerceValue } from '@/schemas/typebox-coerce'

import { OpenAPIDocumentSchema, type OpenApiDocument } from './openapi-document'

describe('openapi-document', () => {
  describe('strict type checking', () => {
    it('performs deep type checking on all nested properties', () => {
      type SchemaType = RequiredDeep<Static<typeof OpenAPIDocumentSchema>>
      type TypescriptType = RequiredDeep<OpenApiDocument>

      const _test: SchemaType = {} as TypescriptType
      const _test2: TypescriptType = {} as SchemaType
      expect(_test).toEqual(_test2)
    })
  })

  describe('value checking', () => {
    it('parses minimal valid OpenAPI document correctly', () => {
      const validInput = {
        openapi: '3.1.0',
        info: {
          title: 'Test API',
          version: '1.0.0',
        },
        'x-scalar-original-document-hash': '',
      }

      const result = coerceValue(OpenAPIDocumentSchema, validInput)

      expect(result).toEqual(validInput)
    })

    it('parses comprehensive OpenAPI document with all optional fields', () => {
      const comprehensiveInput = {
        openapi: '3.1.0',
        info: {
          title: 'Comprehensive API',
          version: '2.0.0',
          description: 'A comprehensive API description',
          termsOfService: 'https://example.com/terms',
          contact: {
            name: 'API Support',
            url: 'https://example.com/support',
            email: 'support@example.com',
          },
          license: {
            name: 'MIT',
            url: 'https://opensource.org/licenses/MIT',
          },
        },
        servers: [
          {
            url: 'https://api.example.com',
            description: 'Production server',
          },
        ],
        paths: {
          '/users': {
            get: {
              summary: 'Get users',
              responses: {
                '200': {
                  description: 'Success',
                },
              },
            },
          },
        },
        components: {
          schemas: {
            User: {
              type: 'object',
              properties: {
                id: { type: 'integer' },
                name: { type: 'string' },
              },
            },
          },
        },
        security: [
          {
            apiKey: [],
          },
        ],
        tags: [
          {
            name: 'Users',
            description: 'User management endpoints',
          },
        ],
        externalDocs: {
          description: 'Find more info here',
          url: 'https://example.com/docs',
        },
        'x-scalar-original-document-hash': '',
      }

      const result = coerceValue(OpenAPIDocumentSchema, comprehensiveInput)

      expect(result).toEqual(comprehensiveInput)
    })

    it('handles invalid OpenAPI document missing required fields', () => {
      const invalidInput = {
        // Missing required 'openapi' and 'info' fields
        paths: {
          '/test': {
            get: {
              responses: {
                '200': { description: 'OK' },
              },
            },
          },
        },
      }

      expect(coerceValue(OpenAPIDocumentSchema, invalidInput)).toEqual({
        openapi: '',
        info: { title: '', version: '' },
        paths: {
          '/test': {
            get: { responses: { '200': { description: 'OK' } } },
          },
        },
        'x-scalar-original-document-hash': '',
      })
    })
  })
})
