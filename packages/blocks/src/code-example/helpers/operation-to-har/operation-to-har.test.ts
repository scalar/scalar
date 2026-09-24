import type { HttpMethod } from '@scalar/helpers/http/http-methods'
import { snippetz } from '@scalar/snippetz'
import type { SecuritySchemeObjectSecret } from '@scalar/workspace-store/request-example'
import { coerceValue } from '@scalar/workspace-store/schemas/typebox-coerce'
import type { OperationObject, ServerObject } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { SchemaObjectSchema } from '@scalar/workspace-store/schemas/v3.2/strict/openapi-document'
import { describe, expect, it } from 'vitest'

import { operationToHar } from './operation-to-har'

describe('operationToHar', () => {
  it.each(snippetz().plugins())(
    'preserves mixed serialized query examples in $target/$client',
    ({ target, client }) => {
      const request = operationToHar({
        method: 'get',
        path: '/items',
        server: { url: 'https://example.com' },
        operation: {
          parameters: [
            {
              name: 'term',
              in: 'query',
              required: true,
              examples: { default: { serializedValue: 'term=a%20b&term=c%2Fd' } },
            },
            { name: 'flag', in: 'query', required: true, examples: { default: { dataValue: false } } },
            { name: 'tag', in: 'query', required: true, example: 'a+b' },
          ],
        },
        securitySchemes: [{ type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': 'a+b%20' }],
      })
      const expected = 'https://example.com/items?term=a%20b&term=c%2Fd&flag=false&tag=a%2Bb&key=a%2Bb%2520'
      expect(request.url).toBe(expected)
      expect(request.queryString).toStrictEqual([])
      const snippet = snippetz().findPlugin(target, client)?.generate(request)
      expect(snippet).toBeDefined()
      expect(snippet).not.toContain('?flag=')
      if (target === 'rust' || target === 'ruby') {
        expect(snippet).toContain(expected)
      }
    },
  )

  it.each(snippetz().plugins())('preserves mixed cookie encodings in $target/$client', ({ target, client }) => {
    const request = operationToHar({
      method: 'get',
      path: '/',
      includeDefaultHeaders: false,
      server: { url: 'https://example.com' },
      operation: {
        parameters: [
          { name: 'greeting', in: 'cookie', style: 'cookie', required: true, example: 'Hello%2C%20world!' },
          { name: 'legacy', in: 'cookie', required: true, example: 'a b+c' },
        ],
      },
      globalCookies: [{ name: 'global', value: 'c d', domain: 'example.com', path: '/' }],
      securitySchemes: [{ type: 'apiKey', name: 'token', in: 'cookie', 'x-scalar-secret-token': 'secret+value' }],
    })
    const expected = 'legacy=a%20b%2Bc; greeting=Hello%2C%20world!; global=c%20d; token=secret%2Bvalue'
    expect(request.headers).toStrictEqual([{ name: 'Cookie', value: expected }])
    expect(request.cookies).toStrictEqual([])
    const snippet = snippetz().findPlugin(target, client)?.generate(request)
    expect(snippet).toBeDefined()
    for (const entry of expected.split('; ')) {
      expect(snippet).toContain(entry)
    }
    expect(snippet).not.toContain('Hello%252C%2520world')
    if (target === 'js' && (client === 'xhr' || client === 'jquery')) {
      expect(snippet).toContain('document.cookie')
    } else {
      expect(snippet).toContain(expected)
    }
  })

  it('keeps cookie style, global cookies, and authentication in a single raw header', () => {
    const result = operationToHar({
      method: 'get',
      path: '/',
      includeDefaultHeaders: false,
      server: { url: 'https://example.com' },
      operation: {
        parameters: [{ name: 'greeting', in: 'cookie', style: 'cookie', required: true, example: 'Hello%2C%20world!' }],
      },
      globalCookies: [{ name: 'global', value: 'a b', domain: 'example.com', path: '/' }],
      securitySchemes: [{ type: 'apiKey', name: 'token', in: 'cookie', 'x-scalar-secret-token': 'secret' }],
    })
    expect(result.headers).toStrictEqual([
      { name: 'Cookie', value: 'greeting=Hello%2C%20world!; global=a%20b; token=secret' },
    ])
    expect(result.cookies).toStrictEqual([])
    expect(snippetz().print('shell', 'curl', result)).toContain(
      'greeting=Hello%2C%20world!; global=a%20b; token=secret',
    )
  })

  it.each(['absent', 'disabled', 'empty'] as const)(
    'preserves structured cookies alongside an explicit Cookie header when cookie style is %s',
    (cookieStyle) => {
      const result = operationToHar({
        method: 'get',
        path: '/',
        server: { url: 'https://example.com' },
        operation: {
          parameters: [
            { name: 'Cookie', in: 'header', required: true, example: 'session=abc' },
            { name: 'legacy', in: 'cookie', required: true, example: 'a b' },
            ...(cookieStyle === 'absent'
              ? []
              : [
                  {
                    name: 'styled',
                    in: 'cookie' as const,
                    style: 'cookie' as const,
                    required: true,
                    examples: {
                      default: {
                        value: cookieStyle === 'disabled' ? 'ignored' : [],
                        'x-disabled': cookieStyle === 'disabled',
                      },
                    },
                  },
                ]),
          ],
        },
        globalCookies: [{ name: 'global', value: 'c d', domain: 'example.com', path: '/' }],
        securitySchemes: [{ type: 'apiKey', name: 'token', in: 'cookie', 'x-scalar-secret-token': 'secret' }],
      })

      expect(result.headers).toStrictEqual([{ name: 'Cookie', value: 'session=abc' }])
      expect(result.cookies).toStrictEqual([
        { name: 'global', value: 'c d' },
        { name: 'legacy', value: 'a b' },
        { name: 'token', value: 'secret' },
      ])
    },
  )

  it.each(['xhr', 'jquery'] as const)('sets cookie-style values through the browser cookie store in %s', (client) => {
    const result = operationToHar({
      method: 'get',
      path: '/',
      includeDefaultHeaders: false,
      operation: {
        parameters: [{ name: 'greeting', in: 'cookie', style: 'cookie', required: true, example: 'Hello%2C%20world!' }],
      },
    })
    const snippet = snippetz().print('js', client, result)
    expect(snippet).toContain('document.cookie = "greeting=Hello%2C%20world!; path=/";')
    expect(snippet).not.toContain('setRequestHeader("Cookie"')
    expect(snippet).toContain(client === 'xhr' ? 'xhr.withCredentials = true;' : 'xhrFields: { withCredentials: true }')
  })

  it('preserves the supplied boundary for already serialized multipart bodies', () => {
    const result = operationToHar({
      method: 'post',
      path: '/upload',
      operation: {
        parameters: [
          {
            in: 'header',
            name: 'Content-Type',
            schema: { type: 'string', default: 'multipart/mixed; boundary=example' },
          },
        ],
        requestBody: {
          content: {
            'multipart/mixed': { example: '--example\r\nContent-Type: text/plain\r\n\r\nhello\r\n--example--\r\n' },
          },
        },
      },
    })
    expect(result.headers.find((header) => header.name.toLowerCase() === 'content-type')?.value).toBe(
      'multipart/mixed; boundary=example',
    )
  })

  it('appends query authentication to whole-query content without a second question mark', () => {
    const result = operationToHar({
      operation: {
        parameters: [
          {
            name: 'search',
            in: 'querystring',
            required: true,
            content: { 'application/x-www-form-urlencoded': { example: { filter: 'a + b' } } },
          },
        ],
      },
      method: 'get',
      path: '/search',
      securitySchemes: [{ type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': 'secret' }],
    })
    expect(result.url).toBe('/search?filter=a+%2B+b&key=secret')
    expect(result.queryString).toStrictEqual([])
  })

  it('places whole-query content before named query parameters and authentication in snippets', () => {
    const result = operationToHar({
      operation: {
        parameters: [
          { name: 'tag', in: 'query', required: true, example: 'a+b' },
          { name: 'path', in: 'query', required: true, example: 'a/b', allowReserved: true },
          {
            name: 'search',
            in: 'querystring',
            required: true,
            content: { 'application/json': { example: { limit: 2 } } },
          },
        ],
      },
      method: 'get',
      path: '/search',
      securitySchemes: [{ type: 'apiKey', in: 'query', name: 'key', 'x-scalar-secret-token': 'a+b%20' }],
    })
    expect(result.url).toBe('/search?%7B%22limit%22%3A2%7D&tag=a%2Bb&path=a/b&key=a%2Bb%2520')
    expect(result.queryString).toStrictEqual([])
  })

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
            examples: {
              'other': {
                value: '999',
              },
              'stuff': {
                value: '123',
              },
            },
          },
          {
            name: 'test',
            in: 'query',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: {
              'other': {
                value: 'abc',
              },
              'stuff': {
                value: 'def',
              },
            },
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
        example: 'stuff',
      })

      expect(result.url).toBe('https://api.example.com/users/123')
      expect(result.queryString).toContainEqual({ name: 'test', value: 'def' })
    })

    it('should handle server with variables and query parameters', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'filter',
            in: 'query',
            required: true,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
            }),
            examples: {
              'filter': {
                value: 'active',
              },
            },
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
        example: 'filter',
      })

      expect(result.url).toBe('https://api.example.com/users')
      expect(result.queryString).toContainEqual({ name: 'filter', value: 'active' })
    })
  })

  describe('request body handling', () => {
    it('should include request body when provided', () => {
      const example = {
        name: 'John Doe',
        age: 30,
      }

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
              examples: {
                'test': {
                  value: example,
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

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        example: 'test',
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

    it('uses selected root request body compositions when generating examples', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                anyOf: [
                  {
                    type: 'object',
                    properties: {
                      primaryOnlyField: { type: 'string' },
                    },
                  },
                  {
                    type: 'object',
                    properties: {
                      secondaryOnlyField: { type: 'integer' },
                    },
                  },
                ],
              }),
            },
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/widgets',
        requestBodyCompositionSelection: {
          'requestBody.anyOf': 1,
        },
      })

      expect(result.postData?.text).toBe(JSON.stringify({ secondaryOnlyField: 1 }))
    })

    it('uses selected nested request body compositions when generating examples', () => {
      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: coerceValue(SchemaObjectSchema, {
                type: 'object',
                properties: {
                  payload: {
                    anyOf: [
                      {
                        type: 'object',
                        properties: {
                          nestedPrimaryOnlyField: { type: 'string' },
                        },
                      },
                      {
                        type: 'object',
                        properties: {
                          nestedSecondaryOnlyField: { type: 'integer' },
                        },
                      },
                    ],
                  },
                },
              }),
            },
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/widgets',
        requestBodyCompositionSelection: {
          'requestBody.payload.anyOf': 1,
        },
      })

      expect(result.postData?.text).toBe(JSON.stringify({ payload: { nestedSecondaryOnlyField: 1 } }))
    })

    it('uses selected nested request body compositions when nested branches contain refs', () => {
      const reprojectTransform = {
        type: 'object',
        properties: {
          mode: { type: 'string', const: 'reproject' },
          epsg: { type: 'integer', example: 4326 },
        },
      }

      const clipTransform = {
        type: 'object',
        properties: {
          mode: { type: 'string', const: 'clip' },
          bbox: {
            type: 'array',
            example: [34.8, 31.9, 35.1, 32.1],
            items: { type: 'number' },
          },
        },
      }

      const bufferTransform = {
        type: 'object',
        properties: {
          mode: { type: 'string', const: 'buffer' },
          distanceMeters: { type: 'integer', example: 25 },
        },
      }

      const simplifyTransform = {
        type: 'object',
        properties: {
          mode: { type: 'string', const: 'simplify' },
          tolerance: { type: 'number', example: 0.5 },
        },
      }

      const operation: OperationObject = {
        requestBody: {
          content: {
            'application/json': {
              schema: {
                type: 'object',
                properties: {
                  jobName: { type: 'string', example: 'nightly-import' },
                  payload: {
                    anyOf: [
                      {
                        $ref: '#/components/schemas/NestedFilePayload',
                        '$ref-value': {
                          type: 'object',
                          properties: {
                            payloadType: { type: 'string', const: 'file' },
                            fileName: {
                              type: 'string',
                              example: 'buildings.geojson',
                            },
                            transform: {
                              oneOf: [
                                {
                                  $ref: '#/components/schemas/ReprojectTransform',
                                  '$ref-value': reprojectTransform,
                                },
                                {
                                  $ref: '#/components/schemas/ClipTransform',
                                  '$ref-value': clipTransform,
                                },
                              ],
                            },
                          },
                        },
                      },
                      {
                        $ref: '#/components/schemas/NestedServicePayload',
                        '$ref-value': {
                          type: 'object',
                          properties: {
                            payloadType: { type: 'string', const: 'service' },
                            layerName: { type: 'string', example: 'zoning' },
                            transform: {
                              oneOf: [
                                {
                                  $ref: '#/components/schemas/BufferTransform',
                                  '$ref-value': bufferTransform,
                                },
                                {
                                  $ref: '#/components/schemas/SimplifyTransform',
                                  '$ref-value': simplifyTransform,
                                },
                              ],
                            },
                          },
                        },
                      },
                    ],
                  },
                },
              } as any,
            },
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/nested',
        requestBodyCompositionSelection: {
          'requestBody.payload.anyOf': 1,
          'requestBody.payload.transform.oneOf': 1,
        },
      })

      expect(result.postData?.text).toBe(
        JSON.stringify({
          jobName: 'nightly-import',
          payload: {
            payloadType: 'service',
            layerName: 'zoning',
            transform: {
              mode: 'simplify',
              tolerance: 0.5,
            },
          },
        }),
      )
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

      const securitySchemes: SecuritySchemeObjectSecret[] = [
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
      const example = {
        stringProp: 'hello',
        numberProp: 42,
        boolProp: true,
        nullProp: null,
        arrayProp: [1, 2, 3],
        objectProp: { foo: 'bar' },
      }

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
              examples: {
                'test': {
                  value: example,
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

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/data',
        example: 'test',
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
      })

      expect(result.postData?.mimeType).toBe('application/x-www-form-urlencoded')
      expect(result.postData?.params).toEqual([
        {
          name: 'name',
          value: '',
        },
        {
          name: 'email',
          value: '',
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
      })

      expect(result.postData?.mimeType).toBe('multipart/form-data')
      expect(result.postData?.params).toEqual([
        {
          name: 'file',
          value: '@filename',
        },
        {
          name: 'description',
          value: '',
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
      })

      expect(result.postData?.mimeType).toBe('text/plain')
      expect(result.postData?.text).toBe('')
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
      })

      expect(result.postData?.mimeType).toBe('application/xml')
      expect(result.postData?.text).toBe(
        `<?xml version="1.0" encoding="UTF-8"?>
<user>
  <name></name>
  <email></email>
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
      })

      expect(result.postData?.mimeType).toBe('application/vnd.api+json')
      expect(result.postData?.text).toBe(JSON.stringify({ data: { type: '', attributes: {} } }))
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

      expect(result.postData).toBeUndefined()
    })

    it('should handle contentType parameter with no matching content', () => {
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
        contentType: 'application/xml',
      })

      expect(result.postData?.mimeType).toBe('application/xml')
      expect(result.postData?.text).toBe(`<?xml version="1.0" encoding="UTF-8"?>
<name></name>`)
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
      })

      expect(result.postData?.mimeType).toBe('text/plain')
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'text/plain',
      })
    })
  })

  describe('default headers', () => {
    it('uses conventional casing for default headers in HAR output', () => {
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
            content: {
              'application/json': {},
            },
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'post',
        path: '/api/users',
        includeDefaultHeaders: true,
      })

      expect(result.headers).toContainEqual({
        name: 'Accept',
        value: 'application/json',
      })
      expect(result.headers).toContainEqual({
        name: 'Content-Type',
        value: 'application/json',
      })
      expect(result.headers.some((header) => header.name === 'accept')).toBe(false)
      expect(result.headers.some((header) => header.name === 'content-type')).toBe(false)
    })
  })

  describe('defaultDisabledParameters', () => {
    it('includes optional query parameters by default', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'findme',
            }),
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/search',
      })

      expect(result.queryString).toContainEqual({ name: 'q', value: 'findme' })
    })

    it('includes populated optional query parameters when defaultDisabledParameters is true', () => {
      const operation: OperationObject = {
        parameters: [
          {
            name: 'q',
            in: 'query',
            required: false,
            schema: coerceValue(SchemaObjectSchema, {
              type: 'string',
              example: 'findme',
            }),
          },
        ],
        responses: {
          '200': {
            description: 'OK',
          },
        },
      }

      const result = operationToHar({
        operation,
        method: 'get',
        path: '/search',
        defaultDisabledParameters: true,
      })

      expect(result.queryString).toStrictEqual([{ name: 'q', value: 'findme' }])
    })
  })
})
