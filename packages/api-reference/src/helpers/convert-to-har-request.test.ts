import {
  type Operation,
  type RequestExample,
  type Server,
  operationSchema,
  requestExampleSchema,
  serverSchema,
} from '@scalar/oas-utils/entities/spec'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { convertToHarRequest } from './convert-to-har-request'

describe('convertToHarRequest', () => {
  let server: Server
  let operation: Operation
  let example: RequestExample

  beforeEach(() => {
    server = serverSchema.parse({
      uid: 'server-uid',
      url: 'https://api.example.com',
    })
    operation = operationSchema.parse({
      uid: 'operation-uid',
      path: '/users',
      method: 'get',
    })
    example = requestExampleSchema.parse({
      uid: 'example-uid',
      method: 'get',
      headers: [],
      queryString: [],
    })
  })

  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('converts a basic GET request', async () => {
    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        {
          name: 'Accept',
          value: '*/*',
        },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a POST request with JSON body', async () => {
    operation.method = 'post'
    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'application/json',
      enabled: true,
    })
    example.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'json',
        value: JSON.stringify({ name: 'John Doe' }),
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest).toEqual({
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        {
          name: 'Accept',
          value: '*/*',
        },
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ name: 'John Doe' }),
      },
    })
  })

  it('converts a request with query parameters', async () => {
    example.parameters.query.push(
      {
        key: 'page',
        value: '1',
        enabled: true,
      },
      {
        key: 'limit',
        value: '10',
        enabled: true,
      },
    )

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        {
          name: 'Accept',
          value: '*/*',
        },
      ],
      queryString: [
        { name: 'page', value: '1' },
        { name: 'limit', value: '10' },
      ],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with headers', async () => {
    const testToken = 'xxxxx'

    example.parameters.headers.push({
      key: 'Authorization',
      value: `Bearer ${testToken}`,
      enabled: true,
    })

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Accept', value: '*/*' },
        { name: 'Authorization', value: `Bearer ${testToken}` },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with cookies', async () => {
    example.parameters.cookies.push(
      {
        key: 'sessionId',
        value: 'abc123',
        enabled: true,
      },
      {
        key: 'theme',
        value: 'dark',
        enabled: true,
      },
    )

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Accept', value: '*/*' }],
      queryString: [],
      cookies: [
        { name: 'sessionId', value: 'abc123' },
        { name: 'theme', value: 'dark' },
      ],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with form-data body', async () => {
    operation.method = 'post'

    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'multipart/form-data',
      enabled: true,
    })

    example.body = {
      activeBody: 'formData',
      formData: {
        value: [
          { key: 'name', value: 'John Doe', enabled: true },
          { key: 'occupation', value: 'Engineer', enabled: true },
        ],
        encoding: 'form-data',
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.text).toEqual(
      '{"name":"John Doe","occupation":"Engineer"}',
    )
  })

  it('converts a request with multiple of the same key in form-data as an array', async () => {
    operation.method = 'post'

    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'multipart/form-data',
      enabled: true,
    })

    example.body = {
      activeBody: 'formData',
      formData: {
        value: [
          { key: 'name', value: 'John Doe', enabled: true },
          { key: 'name', value: 'Jane Doe', enabled: true },
          { key: 'name', value: 'Jimmy Doe', enabled: true },
        ],
        encoding: 'form-data',
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.text).toEqual(
      '{"name":["John Doe","Jane Doe","Jimmy Doe"]}',
    )
  })

  it('converts a request with form-data body with a file', async () => {
    operation.method = 'post'

    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'multipart/form-data',
      enabled: true,
    })

    example.body = {
      activeBody: 'formData',
      formData: {
        value: [
          {
            key: 'file',
            value: 'test.txt',
            file: new Blob(['test content'], { type: 'text/plain' }),
            enabled: true,
          },
        ],
        encoding: 'form-data',
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.text).equal(
      '{"file":{"type":"file","text":"BINARY","name":"file","size":12,"mimeType":"text/plain"}}',
    )
  })

  it('converts a request with URL-encoded body', async () => {
    operation.method = 'post'

    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'application/x-www-form-urlencoded',
      enabled: true,
    })
    example.body = {
      activeBody: 'formData',
      formData: {
        encoding: 'urlencoded',
        value: [
          { key: 'name', value: 'John Doe', enabled: true },
          { key: 'age', value: '30', enabled: true },
        ],
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.postData).toEqual({
      mimeType: 'application/x-www-form-urlencoded',
      text: 'name=John+Doe&age=30',
    })
  })

  it('handles requests with multiple cookies', async () => {
    example.parameters.cookies.push(
      {
        key: 'sessionId',
        value: 'abc123',
        enabled: true,
      },
      {
        key: 'theme',
        value: 'dark',
        enabled: true,
      },
      {
        key: 'user',
        value: 'john',
        enabled: true,
      },
      {
        key: 'remember',
        value: 'true',
        enabled: true,
      },
    )

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.cookies).toHaveLength(4)
    expect(harRequest.cookies).toEqual([
      { name: 'sessionId', value: 'abc123' },
      { name: 'theme', value: 'dark' },
      { name: 'user', value: 'john' },
      { name: 'remember', value: 'true' },
    ])
  })

  it('handles requests with array like query parameters', async () => {
    example.parameters.query.push(
      {
        key: 'q',
        value: 'test query',
        enabled: true,
      },
      {
        key: 'filters',
        value: 'one',
        enabled: true,
      },
      {
        key: 'filters',
        value: 'two',
        enabled: true,
      },
    )

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.queryString).toEqual([
      { name: 'q', value: 'test query' },
      { name: 'filters', value: 'one' },
      { name: 'filters', value: 'two' },
    ])
  })

  it('handles requests with non-JSON content types', async () => {
    operation.method = 'post'

    example.parameters.headers.push({
      key: 'Content-Type',
      value: 'text/plain',
      enabled: true,
    })
    example.body = {
      activeBody: 'raw',
      raw: {
        encoding: 'text',
        value: 'Hello, World!',
      },
    }

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.postData).toEqual({
      mimeType: 'text/plain',
      text: 'Hello, World!',
    })
  })

  it('handles a server with variables', async () => {
    server = serverSchema.parse({
      uid: 'server-uid',
      url: '{protocol}://void.scalar.com/{path}',
      description: 'Responds with your request data',
      variables: {
        protocol: {
          enum: ['https'],
          default: 'https',
        },
        path: {
          default: '',
        },
      },
    })

    const harRequest = await convertToHarRequest(operation, example, server)

    expect(harRequest.url).toEqual('{protocol}://void.scalar.com/{path}/users')
  })
})
