import { afterEach, describe, expect, it, vi } from 'vitest'

import { convertToHarRequest } from './convert-to-har-request'

describe('convertToHarRequest', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('converts a basic GET request', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [],
      headers: [],
      query: [],
    })
    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a POST request with JSON body', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      cookies: [],
      headers: [
        {
          key: 'Content-Type',
          value: 'application/json',
          enabled: true,
        },
      ],
      query: [],
      body: {
        activeBody: 'raw',
        raw: {
          encoding: 'json',
          value: JSON.stringify({ name: 'John Doe' }),
        },
      },
    })
    expect(harRequest).toEqual({
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
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

  it('converts a request with query parameters', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [],
      headers: [],
      query: [
        { key: 'page', value: '1', enabled: true },
        { key: 'limit', value: '10', enabled: true },
      ],
    })

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [
        { name: 'page', value: '1' },
        { name: 'limit', value: '10' },
      ],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with headers', () => {
    const testToken = 'xxxxx'
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [],
      headers: [
        {
          key: 'Authorization',
          value: `Bearer ${testToken}`,
          enabled: true,
        },
      ],
      query: [],
    })

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Authorization', value: `Bearer ${testToken}` }],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('shows the accept header if its not */*', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [],
      headers: [
        {
          key: 'Accept',
          value: 'application/json',
          enabled: true,
        },
      ],
      query: [],
    })

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Accept', value: 'application/json' }],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with cookies', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      headers: [],
      cookies: [
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
      ],
      query: [],
    })

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [
        { name: 'sessionId', value: 'abc123' },
        { name: 'theme', value: 'dark' },
      ],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with form-data body', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      headers: [
        {
          key: 'Content-Type',
          value: 'multipart/form-data',
          enabled: true,
        },
      ],
      cookies: [],
      query: [],
      body: {
        activeBody: 'formData',
        formData: {
          encoding: 'form-data',
          value: [
            { key: 'name', value: 'John Doe', enabled: true },
            { key: 'occupation', value: 'Engineer', enabled: true },
          ],
        },
      },
    })

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.params).toMatchObject([
      { name: 'name', value: 'John Doe' },
      { name: 'occupation', value: 'Engineer' },
    ])
  })

  it('converts a request with multiple of the same key in form-data as an array', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      headers: [
        {
          key: 'Content-Type',
          value: 'multipart/form-data',
          enabled: true,
        },
      ],
      cookies: [],
      query: [],
      body: {
        activeBody: 'formData',
        formData: {
          value: [
            { key: 'name', value: 'John Doe', enabled: true },
            { key: 'name', value: 'Jane Doe', enabled: true },
            { key: 'name', value: 'Jimmy Doe', enabled: true },
          ],
          encoding: 'form-data',
        },
      },
    })

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.params).toMatchObject([
      { name: 'name', value: 'John Doe' },
      { name: 'name', value: 'Jane Doe' },
      { name: 'name', value: 'Jimmy Doe' },
    ])
  })

  it('converts a request with form-data body with a file', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      headers: [
        {
          key: 'Content-Type',
          value: 'multipart/form-data',
          enabled: true,
        },
      ],
      cookies: [],
      query: [],
      body: {
        activeBody: 'formData',
        formData: {
          value: [
            {
              key: 'file',
              value: 'ignore this',
              file: new File(['test content'], 'test.txt', { type: 'text/plain' }),
              enabled: true,
            },
          ],
          encoding: 'form-data',
        },
      },
    })

    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.params).toMatchObject([
      {
        name: 'file',
        fileName: 'test.txt',
        contentType: 'text/plain',
        value: 'BINARY',
      },
    ])
  })

  it('converts a request with URL-encoded body', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      headers: [
        {
          key: 'Content-Type',
          value: 'application/x-www-form-urlencoded',
          enabled: true,
        },
      ],
      cookies: [],
      query: [],
      body: {
        activeBody: 'formData',
        formData: {
          encoding: 'urlencoded',
          value: [
            { key: 'name', value: 'John Doe', enabled: true },
            { key: 'age', value: '30', enabled: true },
          ],
        },
      },
    })

    expect(harRequest.postData).toEqual({
      mimeType: 'application/x-www-form-urlencoded',
      params: [
        { name: 'name', value: 'John Doe' },
        { name: 'age', value: '30' },
      ],
    })
  })

  it('handles requests with multiple cookies', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [
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
      ],
      query: [],
      headers: [],
    })

    expect(harRequest.cookies).toHaveLength(4)
    expect(harRequest.cookies).toEqual([
      { name: 'sessionId', value: 'abc123' },
      { name: 'theme', value: 'dark' },
      { name: 'user', value: 'john' },
      { name: 'remember', value: 'true' },
    ])
  })

  it('handles requests with array like query parameters', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'get',
      path: '/users',
      cookies: [],
      query: [
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
      ],
      headers: [],
    })

    expect(harRequest.queryString).toEqual([
      { name: 'q', value: 'test query' },
      { name: 'filters', value: 'one' },
      { name: 'filters', value: 'two' },
    ])
  })

  it('handles requests with non-JSON content types', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'https://api.example.com',
      method: 'post',
      path: '/users',
      cookies: [],
      query: [],
      headers: [
        {
          key: 'Content-Type',
          value: 'text/plain',
          enabled: true,
        },
      ],
      body: {
        activeBody: 'raw',
        raw: {
          encoding: 'text',
          value: 'Hello, World!',
        },
      },
    })

    expect(harRequest.postData).toEqual({
      mimeType: 'text/plain',
      text: 'Hello, World!',
    })
  })

  it('handles a server with variables in the scheme', () => {
    const harRequest = convertToHarRequest({
      baseUrl: '{protocol}://void.scalar.com/{path}',
      method: 'get',
      path: '/users',
      cookies: [],
      query: [],
      headers: [],
    })
    expect(harRequest.url).toEqual('{protocol}://void.scalar.com/{path}/users')
  })

  it('handles an invalid server with variables', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'void.scalar.com/{path}',
      method: 'get',
      path: '/users/{id}',
      cookies: [],
      query: [],
      headers: [],
    })
    expect(harRequest.url).toEqual('void.scalar.com/{path}/users/{id}')
  })

  it('handles a server with variables', () => {
    const harRequest = convertToHarRequest({
      baseUrl: 'file://{void}.scalar.com/{path}',
      method: 'get',
      path: '/users',
      cookies: [],
      query: [],
      headers: [],
    })
    expect(harRequest.url).toEqual('file://{void}.scalar.com/{path}/users')
  })

  it('handles no server', () => {
    const harRequest = convertToHarRequest({
      baseUrl: undefined,
      method: 'get',
      path: 'http://google.ca',
      cookies: [],
      query: [],
      headers: [],
    })
    expect(harRequest.url).toEqual('http://google.ca')
  })
})
