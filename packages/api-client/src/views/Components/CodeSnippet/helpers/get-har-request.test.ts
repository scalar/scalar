import {
  operationSchema,
  requestExampleSchema,
  securitySchemeSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { getHarRequest } from './get-har-request'

/** Used for the tests */
const BASE_HAR_REQUEST = {
  bodySize: -1,
  method: 'GET',
  url: '/',
  headers: [],
  cookies: [],
  queryString: [],
  headersSize: -1,
  httpVersion: 'HTTP/1.1',
}

describe('getHarRequest', () => {
  it('should create a basic HAR request with minimal inputs', () => {
    const result = getHarRequest({})
    expect(result).toEqual(BASE_HAR_REQUEST)
  })

  it('should include server URL and operation details', () => {
    const operation = operationSchema.parse({
      method: 'post',
      path: '/users',
      tags: [],
      security: [],
    })
    const server = serverSchema.parse({
      url: 'https://api.example.com',
    })

    const result = getHarRequest({ operation, server })

    expect(result).toEqual({
      ...BASE_HAR_REQUEST,
      method: 'POST',
      url: 'https://api.example.com/users',
    })
  })

  it('should merge security with example parameters', () => {
    const operation = operationSchema.parse({
      method: 'post',
      path: '/users',
      tags: [],
      security: [],
    })

    const example = requestExampleSchema.parse({
      parameters: {
        headers: [
          { key: 'Content-Type', value: 'application/json', enabled: true },
        ],
        cookies: [{ key: 'session', value: '123', enabled: true }],
        query: [{ key: 'filter', value: 'active', enabled: true }],
      },
      body: {
        activeBody: 'raw',
        raw: { encoding: 'json', value: '{"name": "test"}' },
      },
    })
    const securitySchemes = [
      securitySchemeSchema.parse({
        type: 'http',
        scheme: 'bearer',
        bearerFormat: 'Bearer',
        name: 'Authorization',
        in: 'header',
        token: 'http-token',
      }),
      securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'api_key',
        in: 'query',
        value: 'api-token',
      }),
      securitySchemeSchema.parse({
        type: 'apiKey',
        name: 'auth',
        in: 'cookie',
        value: 'token123',
      }),
    ]

    const result = getHarRequest({ example, securitySchemes, operation })

    expect(result).toEqual({
      ...BASE_HAR_REQUEST,
      method: 'POST',
      url: '/users',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        {
          name: 'Authorization',
          value: 'Bearer http-token',
        },
      ],
      cookies: [
        { name: 'session', value: '123' },
        { name: 'auth', value: 'token123' },
      ],
      queryString: [
        { name: 'filter', value: 'active' },
        { name: 'api_key', value: 'api-token' },
      ],
      postData: { mimeType: 'application/json', text: '{"name": "test"}' },
    })
  })
})
