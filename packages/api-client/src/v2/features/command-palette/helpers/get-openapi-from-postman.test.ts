import type { OpenAPIV3_1 } from '@scalar/openapi-types'
import { convert } from '@scalar/postman-to-openapi'
import { describe, expect, it, vi } from 'vitest'

import { getOpenApiFromPostman } from './get-openapi-from-postman'

vi.mock('@scalar/postman-to-openapi', () => ({
  convert: vi.fn(),
}))

describe('getOpenApiFromPostman', () => {
  it('converts valid Postman collection JSON to OpenAPI document', () => {
    const postmanJson = JSON.stringify({
      info: {
        _postman_id: '123',
        name: 'Test Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Test Collection',
        version: '1.0.0',
      },
      paths: {},
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(postmanJson)

    expect(convert).toHaveBeenCalledWith(postmanJson)
    expect(result).toEqual(expectedOpenAPI)
  })

  it('passes the JSON string directly to convert function', () => {
    const postmanJson = '{"info":{"name":"API"}}'

    const mockOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: { title: 'API', version: '1.0' },
      paths: {},
    }

    vi.mocked(convert).mockReturnValue(mockOpenAPI)

    getOpenApiFromPostman(postmanJson)

    expect(convert).toHaveBeenCalledWith(postmanJson)
    expect(convert).toHaveBeenCalledTimes(1)
  })

  it('returns null when conversion fails', () => {
    const postmanJson = '{"invalid":"collection"}'

    vi.mocked(convert).mockImplementation(() => {
      throw new Error('Invalid Postman collection structure')
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when convert throws non-Error object', () => {
    const postmanJson = '{"info":{"name":"Test"}}'

    vi.mocked(convert).mockImplementation(() => {
      throw 'String error'
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when handling JSON parsing errors from convert function', () => {
    const invalidJson = '{not valid json}'

    vi.mocked(convert).mockImplementation(() => {
      throw new Error('Unexpected token n in JSON at position 1')
    })

    const result = getOpenApiFromPostman(invalidJson)

    expect(result).toBeNull()
  })

  it('converts complex Postman collection with multiple requests', () => {
    const complexPostmanJson = JSON.stringify({
      info: {
        _postman_id: 'abc-123',
        name: 'Complex API Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Get Users',
          request: {
            method: 'GET',
            url: 'https://api.example.com/users',
          },
        },
        {
          name: 'Create User',
          request: {
            method: 'POST',
            url: 'https://api.example.com/users',
          },
        },
      ],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Complex API Collection',
        version: '1.0.0',
      },
      paths: {
        '/users': {
          get: {
            summary: 'Get Users',
            responses: {},
          },
          post: {
            summary: 'Create User',
            responses: {},
          },
        },
      },
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(complexPostmanJson)

    expect(result).toEqual(expectedOpenAPI)
    expect(result?.paths).toBeDefined()
    expect(Object.keys(result?.paths ?? {})).toHaveLength(1)
  })

  it('handles empty Postman collection', () => {
    const emptyPostmanJson = JSON.stringify({
      info: {
        _postman_id: 'empty-123',
        name: 'Empty Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Empty Collection',
        version: '1.0.0',
      },
      paths: {},
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(emptyPostmanJson)

    expect(result).toEqual(expectedOpenAPI)
    expect(result?.paths).toEqual({})
  })

  it('handles Postman collection with nested folders', () => {
    const nestedPostmanJson = JSON.stringify({
      info: {
        _postman_id: 'nested-123',
        name: 'Nested Collection',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [
        {
          name: 'Users Folder',
          item: [
            {
              name: 'Get User',
              request: {
                method: 'GET',
                url: 'https://api.example.com/users/:id',
              },
            },
          ],
        },
      ],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Nested Collection',
        version: '1.0.0',
      },
      paths: {
        '/users/{id}': {
          get: {
            summary: 'Get User',
            responses: {},
          },
        },
      },
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(nestedPostmanJson)

    expect(result).toEqual(expectedOpenAPI)
  })

  it('preserves OpenAPI metadata from conversion', () => {
    const postmanJson = JSON.stringify({
      info: {
        _postman_id: 'meta-123',
        name: 'API with Metadata',
        description: 'This is a test API',
        version: '2.0.0',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      item: [],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'API with Metadata',
        description: 'This is a test API',
        version: '2.0.0',
      },
      paths: {},
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(postmanJson)

    expect(result?.info?.description).toBe('This is a test API')
    expect(result?.info?.version).toBe('2.0.0')
  })

  it('handles conversion with authentication', () => {
    const postmanJson = JSON.stringify({
      info: {
        _postman_id: 'auth-123',
        name: 'Authenticated API',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      auth: {
        type: 'bearer',
        bearer: [
          {
            key: 'token',
            value: '{{bearerToken}}',
            type: 'string',
          },
        ],
      },
      item: [],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'Authenticated API',
        version: '1.0.0',
      },
      paths: {},
      components: {
        securitySchemes: {
          bearerAuth: {
            type: 'http',
            scheme: 'bearer',
          },
        },
      },
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(postmanJson)

    expect(result?.components?.securitySchemes).toBeDefined()
  })

  it('returns null when convert throws error', () => {
    const postmanJson = '{"malformed":"data"}'
    const originalError = new Error('Specific validation failed: missing required field')

    vi.mocked(convert).mockImplementation(() => {
      throw originalError
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when handling TypeError from convert function', () => {
    const postmanJson = '{"info":{"name":"Test"}}'

    vi.mocked(convert).mockImplementation(() => {
      throw new TypeError('Cannot read property of undefined')
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when handling number thrown as error', () => {
    const postmanJson = '{"info":{"name":"Test"}}'

    vi.mocked(convert).mockImplementation(() => {
      throw 404
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when handling null thrown as error', () => {
    const postmanJson = '{"info":{"name":"Test"}}'

    vi.mocked(convert).mockImplementation(() => {
      throw null
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns null when handling undefined thrown as error', () => {
    const postmanJson = '{"info":{"name":"Test"}}'

    vi.mocked(convert).mockImplementation(() => {
      throw undefined
    })

    const result = getOpenApiFromPostman(postmanJson)

    expect(result).toBeNull()
  })

  it('returns OpenAPI document with servers from Postman variables', () => {
    const postmanJson = JSON.stringify({
      info: {
        _postman_id: 'server-123',
        name: 'API with Servers',
        schema: 'https://schema.getpostman.com/json/collection/v2.1.0/collection.json',
      },
      variable: [
        {
          key: 'baseUrl',
          value: 'https://api.example.com',
        },
      ],
      item: [],
    })

    const expectedOpenAPI: OpenAPIV3_1.Document = {
      openapi: '3.1.0',
      info: {
        title: 'API with Servers',
        version: '1.0.0',
      },
      servers: [
        {
          url: 'https://api.example.com',
        },
      ],
      paths: {},
    }

    vi.mocked(convert).mockReturnValue(expectedOpenAPI)

    const result = getOpenApiFromPostman(postmanJson)

    expect(result?.servers).toBeDefined()
    expect(result?.servers).toHaveLength(1)
  })
})
