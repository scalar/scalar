import { describe, it, expect } from 'vitest'
import { operationToHar } from './operation-to-har'
import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import type { HttpMethod } from '@scalar/helpers/http/http-methods'

describe('operationToHar', () => {
  describe('basic functionality', () => {
    it('should convert a basic operation to HAR format', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/api/users',
      })

      expect(result).toMatchObject({
        method: 'get',
        url: '/api/users',
      })
    })

    it.each(['get', 'post', 'put', 'delete', 'patch'] as HttpMethod[])(
      'should handle %s method correctly',
      (method) => {
        const operation: OpenAPIV3_1.OperationObject = {
          responses: {
            '200': {
              description: 'OK',
            },
          },
        }

        const result = operationToHar({
          operation,
          method,
          path: '/api/users',
          example: null,
        })

        expect(result.method).toBe(method)
      },
    )
  })

  describe('server configuration', () => {
    it('should include server URL in the final URL', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://api.example.com',
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/api/users',
        server,
      })

      expect(result.url).toBe('https://api.example.com/api/users')
    })

    it('should handle server with variables', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'api',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/api/users',
        server,
      })

      expect(result.url).toBe('https://api.example.com/api/users')
    })

    it('should handle server with multiple variables', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://{environment}.{region}.example.com/{version}',
        variables: {
          environment: {
            default: 'api',
          },
          version: {
            enum: ['v1', 'v2'],
            default: 'v2',
          },
          region: {
            default: 'us-west',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/api/users',
        server,
      })

      expect(result.url).toBe('https://api.us-west.example.com/v2/api/users')
    })

    it('should handle server with variables in path', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://api.example.com/{version}',
        variables: {
          version: {
            default: 'v2',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/users',
        server,
      })

      expect(result.url).toBe('https://api.example.com/v2/users')
    })

    it('should handle server with variables and path parameters', () => {
      const operation: OpenAPIV3_1.OperationObject = {
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
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'api',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/users/{userId}',
        server,
        example: { userId: '123' },
      })

      expect(result.url).toBe('https://api.example.com/users/123')
    })

    it('should handle server with variables and query parameters', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        parameters: [
          {
            name: 'filter',
            in: 'query',
            schema: {
              type: 'string',
            },
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: OpenAPIV3_1.ServerObject = {
        url: 'https://{environment}.example.com',
        variables: {
          environment: {
            default: 'api',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/users',
        server,
        example: { filter: 'active' },
      })

      expect(result.url).toBe('https://api.example.com/users')
      expect(result.queryString).toContainEqual({ name: 'filter', value: 'active' })
    })
  })

  describe('request body handling', () => {
    it('should include request body when provided', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'integer' },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const example = {
        name: 'John Doe',
        age: 30,
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example,
      })

      expect(result.postData).toBeDefined()
      expect(result.postData?.text).toBe(JSON.stringify(example))
      expect(result.postData?.mimeType).toBe('application/json')
    })
  })

  describe('security handling', () => {
    it('should include security headers when provided', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        security: [
          {
            apiKey: [],
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const securitySchemes: OpenAPIV3_1.SecuritySchemeObject[] = [
        {
          type: 'apiKey',
          name: 'X-API-Key',
          in: 'header',
          'x-scalar-secret-token': 'test-key',
        },
      ]

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/api/users',
        securitySchemes,
      })

      expect(result.headers).toContainEqual({
        name: 'X-API-Key',
        value: 'test-key',
      })
    })
  })

  describe('data type handling', () => {
    it('should handle various data types in example', () => {
      const operation: OpenAPIV3_1.OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  stringProp: { type: 'string' },
                  numberProp: { type: 'number' },
                  boolProp: { type: 'boolean' },
                  nullProp: { type: 'null' },
                  arrayProp: { type: 'array', items: { type: 'integer' } },
                  objectProp: { type: 'object', properties: { foo: { type: 'string' } } },
                },
              },
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const example = {
        stringProp: 'hello',
        numberProp: 42,
        boolProp: true,
        nullProp: null,
        arrayProp: [1, 2, 3],
        objectProp: { foo: 'bar' },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/data',
        example,
      })

      expect(result.postData).toBeDefined()
      expect(result.postData?.mimeType).toBe('application/json')
      // Parse the JSON to check each property
      const parsed = result.postData?.text ? JSON.parse(result.postData.text) : {}
      expect(parsed.stringProp).toBe('hello')
      expect(parsed.numberProp).toBe(42)
      expect(parsed.boolProp).toBe(true)
      expect(parsed.nullProp).toBeNull()
      expect(parsed.arrayProp).toEqual([1, 2, 3])
      expect(parsed.objectProp).toEqual({ foo: 'bar' })
    })
  })
})
