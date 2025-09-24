import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type {
  SecuritySchemeObject,
  ServerObject,
  OperationObject,
} from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { describe, expect, it } from 'vitest'
import { operationToHar } from './operation-to-har'

describe('operationToHar', () => {
  describe('basic functionality', () => {
    it('should convert a basic operation to HAR format', () => {
      const operation: OperationObject = {
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
        const operation: OperationObject = {
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
      const operation: OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        parameters: [
          {
            name: 'userId',
            in: 'path',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        parameters: [
          {
            name: 'filter',
            in: 'query',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const server: ServerObject = {
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
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'integer' },
                },
              }),
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

    it('should handle request body without an example', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  age: { type: 'integer' },
                  isActive: { type: 'boolean' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
      })

      expect(result.postData).toBeDefined()
      expect(result.postData?.text).toBe(JSON.stringify({ name: '', age: 1, isActive: true }))
      expect(result.postData?.mimeType).toBe('application/json')
    })
  })

  describe('security handling', () => {
    it('should include security headers when provided', () => {
      const operation: OperationObject = {
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

      const securitySchemes: SecuritySchemeObject[] = [
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
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  stringProp: { type: 'string' },
                  numberProp: { type: 'number' },
                  boolProp: { type: 'boolean' },
                  nullProp: { type: 'null' },
                  arrayProp: { type: 'array', items: { type: 'integer' } },
                  objectProp: { type: 'object', properties: { foo: { type: 'string' } } },
                },
              }),
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

  describe('content type handling', () => {
    it('should use the first content type when no contentType is specified', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
            'application/xml': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { name: 'John Doe' },
      })

      expect(result.postData?.mimeType).toBe('application/json')
    })

    it('should use the specified contentType when provided', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
            'application/xml': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        contentType: 'application/xml',
        example: { name: 'John Doe' },
      })

      expect(result.postData?.mimeType).toBe('application/xml')
    })

    it('should handle application/x-www-form-urlencoded content type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/x-www-form-urlencoded': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                  email: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { name: 'John Doe', email: 'john@example.com' },
      })

      expect(result.postData?.mimeType).toBe('application/x-www-form-urlencoded')
      expect(result.postData?.params).toEqual([
        {
          name: 'name',
          value: 'John Doe',
        },
        {
          name: 'email',
          value: 'john@example.com',
        },
      ])
    })

    it('should handle multipart/form-data content type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                  description: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/upload',
        example: {
          file: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
          description: 'Test image',
        },
      })

      expect(result.postData?.mimeType).toBe('multipart/form-data')
      expect(result.postData?.params).toEqual([
        {
          name: 'file',
          value:
            'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
        },
        {
          name: 'description',
          value: 'Test image',
        },
      ])
    })

    it('should handle text/plain content type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'text/plain': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/text',
        example: 'Hello, World!',
      })

      expect(result.postData?.mimeType).toBe('text/plain')
      expect(result.postData?.text).toBe(JSON.stringify('Hello, World!'))
    })

    it('should handle application/xml content type', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/xml': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  user: {
                    type: 'object',
                    properties: {
                      name: { type: 'string' },
                      email: { type: 'string' },
                    },
                  },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { user: { name: 'John Doe', email: 'john@example.com' } },
      })

      expect(result.postData?.mimeType).toBe('application/xml')
      expect(result.postData?.text).toBe(
        `<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name>John Doe</name>
  <email>john@example.com</email>
</user>`,
      )
    })

    it('should handle custom content types', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/vnd.api+json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  data: {
                    type: 'object',
                    properties: {
                      type: { type: 'string' },
                      attributes: { type: 'object' },
                    },
                  },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/resources',
        example: { data: { type: 'users', attributes: { name: 'John' } } },
      })

      expect(result.postData?.mimeType).toBe('application/vnd.api+json')
      expect(result.postData?.text).toBe(JSON.stringify({ data: { type: 'users', attributes: { name: 'John' } } }))
    })

    it('should handle operations with no requestBody', () => {
      const operation: OperationObject = {
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

      expect(result.postData).toBeUndefined()
    })

    it('should handle operations with empty content object', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {},
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
      })

      expect(result.postData?.mimeType).toBe('')
      expect(result.postData?.text).toBe('null')
    })

    it('should handle contentType parameter with no matching content', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        contentType: 'application/xml',
        example: { name: 'John Doe' },
      })

      expect(result.postData?.mimeType).toBe('application/xml')
      expect(result.postData?.text).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<name>John Doe</name>`)
    })

    it('should set Content-Type header when request body is present', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { name: 'John Doe' },
      })

      expect(result.postData?.mimeType).toBe('application/json')
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'application/json',
      })
    })

    it('should set Content-Type header for different content types', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/xml': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { name: 'John Doe' },
      })

      expect(result.postData?.mimeType).toBe('application/xml')
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'application/xml',
      })
    })

    it('should not duplicate Content-Type header if it already exists', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'Content-Type',
            in: 'header',
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
          },
        ],
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  name: { type: 'string' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: { name: 'John Doe' },
      })

      const contentTypeHeaders = result.headers.filter((header) => header.name === 'Content-Type')
      expect(contentTypeHeaders).toHaveLength(1)
      expect(contentTypeHeaders[0]?.value).toBe('application/json')
    })

    it('should not set Content-Type header when no request body is present', () => {
      const operation: OperationObject = {
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

      expect(result.postData).toBeUndefined()
      expect(result.headers).not.toContainEqual(expect.objectContaining({ name: 'Content-Type' }))
    })

    it('should set Content-Type header for multipart/form-data', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'multipart/form-data': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  file: { type: 'string', format: 'binary' },
                },
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/upload',
        example: { file: 'test-file.txt' },
      })

      expect(result.postData?.mimeType).toBe('multipart/form-data')
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'multipart/form-data',
      })
    })

    it('should set Content-Type header for text/plain', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'text/plain': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'string',
              }),
            },
          },
        },
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/text',
        example: 'Hello, World!',
      })

      expect(result.postData?.mimeType).toBe('text/plain')
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'text/plain',
      })
    })
  })
})
