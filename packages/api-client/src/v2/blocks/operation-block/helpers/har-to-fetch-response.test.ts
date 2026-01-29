import type { HarResponse } from '@scalar/snippetz'
import { assert, describe, expect, it } from 'vitest'

import { harToFetchResponse } from './har-to-fetch-response'

describe('harToFetchResponse', () => {
  it('converts basic successful response from HAR', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      cookies: [],
      content: {
        size: 27,
        mimeType: 'application/json',
        text: '{"message":"success"}',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: 27,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
      url: 'https://api.example.com/users',
      duration: 150,
    })

    expect(response.status).toBe(200)
    expect(response.statusText).toBe('OK')
    expect(response.method).toBe('get')
    expect(response.path).toBe('/users')
    expect(response.url).toBe('https://api.example.com/users')
    expect(response.duration).toBe(150)
    assert('data' in response)
    expect(response.data).toBe('{"message":"success"}')
    expect(response.size).toBe(21) // String length, not byte length
  })

  it('converts 404 error response', () => {
    const harResponse: HarResponse = {
      status: 404,
      statusText: 'Not Found',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users/999',
    })

    expect(response.status).toBe(404)
    expect(response.statusText).toBe('Not Found')
  })

  it('converts 500 server error response', () => {
    const harResponse: HarResponse = {
      status: 500,
      statusText: 'Internal Server Error',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'post',
      path: '/users',
    })

    expect(response.status).toBe(500)
    expect(response.statusText).toBe('Internal Server Error')
  })

  it('converts headers from HAR to ResponseInstance', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Cache-Control', value: 'no-cache' },
        { name: 'X-Custom-Header', value: 'custom-value' },
      ],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'application/json',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
    })

    expect(response.headers['content-type']).toBe('application/json')
    expect(response.headers['cache-control']).toBe('no-cache')
    expect(response.headers['x-custom-header']).toBe('custom-value')
  })

  it('handles response with JSON body', () => {
    const jsonBody = JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      cookies: [],
      content: {
        size: jsonBody.length,
        mimeType: 'application/json',
        text: jsonBody,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: jsonBody.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users/1',
    })

    assert('data' in response)
    expect(response.data).toBe(jsonBody)
    expect(response.size).toBe(jsonBody.length)
  })

  it('handles response with HTML body', () => {
    const htmlBody = '<html><body>Hello World</body></html>'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/html' }],
      cookies: [],
      content: {
        size: htmlBody.length,
        mimeType: 'text/html',
        text: htmlBody,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: htmlBody.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/',
    })

    assert('data' in response)
    expect(response.data).toBe(htmlBody)
  })

  it('handles response with encoded content', () => {
    const text = 'encoded content'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: text.length,
        mimeType: 'application/octet-stream',
        text,
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: text.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/file',
    })

    assert('data' in response)
    expect(response.data).toBe(text)
    expect(response.size).toBe(text.length)
  })

  it('handles empty response body', () => {
    const harResponse: HarResponse = {
      status: 204,
      statusText: 'No Content',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: '',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'delete',
      path: '/users/1',
    })

    expect(response.status).toBe(204)
    assert('data' in response)
    expect(response.data).toBe('')
    expect(response.size).toBe(0)
  })

  it('handles response without text content', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'application/json',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
    })

    assert('data' in response)
    expect(response.data).toBe('')
    expect(response.size).toBe(0)
  })

  it('detects Set-Cookie headers as cookie headers', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Set-Cookie', value: 'session_id=abc123; Path=/' },
      ],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'application/json',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'post',
      path: '/login',
    })

    expect(response.cookieHeaderKeys.length).toBeGreaterThan(0)
  })

  it('uses default values for optional parameters', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
    })

    expect(response.url).toBe('')
    expect(response.duration).toBe(0)
  })

  it('handles 201 Created response', () => {
    const harResponse: HarResponse = {
      status: 201,
      statusText: 'Created',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Location', value: '/users/123' },
        { name: 'Content-Type', value: 'application/json' },
      ],
      cookies: [],
      content: {
        size: 14,
        mimeType: 'application/json',
        text: '{"id": "123"}',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: 14,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'post',
      path: '/users',
    })

    expect(response.status).toBe(201)
    expect(response.statusText).toBe('Created')
    expect(response.headers['location']).toBe('/users/123')
  })

  it('handles 301 redirect response', () => {
    const harResponse: HarResponse = {
      status: 301,
      statusText: 'Moved Permanently',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Location', value: 'https://example.com/new-location' }],
      cookies: [],
      content: {
        size: 0,
        mimeType: '',
      },
      redirectURL: 'https://example.com/new-location',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/old-location',
    })

    expect(response.status).toBe(301)
    expect(response.headers['location']).toBe('https://example.com/new-location')
  })

  it('handles 401 Unauthorized response', () => {
    const harResponse: HarResponse = {
      status: 401,
      statusText: 'Unauthorized',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'WWW-Authenticate', value: 'Bearer realm="example"' }],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/protected',
    })

    expect(response.status).toBe(401)
    expect(response.headers['www-authenticate']).toBe('Bearer realm="example"')
  })

  it('handles UTF-8 encoded response body', () => {
    const utf8Body = JSON.stringify({ message: '你好世界' })
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      cookies: [],
      content: {
        size: utf8Body.length,
        mimeType: 'application/json',
        text: utf8Body,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: utf8Body.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/messages',
    })

    assert('data' in response)
    expect(response.data).toBe(utf8Body)
  })

  it('handles XML response', () => {
    const xmlBody = '<?xml version="1.0"?><user><name>John</name></user>'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/xml' }],
      cookies: [],
      content: {
        size: xmlBody.length,
        mimeType: 'application/xml',
        text: xmlBody,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: xmlBody.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users/1',
    })

    assert('data' in response)
    expect(response.data).toBe(xmlBody)
  })

  it('handles multiple headers with same name', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Set-Cookie', value: 'session=abc123' },
        { name: 'Set-Cookie', value: 'theme=dark' },
        { name: 'Cache-Control', value: 'no-cache' },
      ],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
    })

    // Object.fromEntries only keeps the last value when there are duplicate keys
    expect(response.headers['set-cookie']).toBe('theme=dark')
    expect(response.headers['cache-control']).toBe('no-cache')
  })

  it('handles different HTTP methods', () => {
    const methods: Array<{ method: 'get' | 'post' | 'put' | 'patch' | 'delete' }> = [
      { method: 'get' },
      { method: 'post' },
      { method: 'put' },
      { method: 'patch' },
      { method: 'delete' },
    ]

    methods.forEach(({ method }) => {
      const harResponse: HarResponse = {
        status: 200,
        statusText: 'OK',
        httpVersion: 'HTTP/1.1',
        headers: [],
        cookies: [],
        content: {
          size: 0,
          mimeType: 'text/plain',
        },
        redirectURL: '',
        headersSize: -1,
        bodySize: -1,
      }

      const response = harToFetchResponse({
        harResponse,
        method,
        path: '/test',
      })

      expect(response.method).toBe(method)
    })
  })

  it('tracks response duration', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/users',
      duration: 350,
    })

    expect(response.duration).toBe(350)
  })

  it('handles GraphQL response', () => {
    const graphqlBody = JSON.stringify({
      data: { user: { name: 'John', email: 'john@example.com' } },
    })
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      cookies: [],
      content: {
        size: graphqlBody.length,
        mimeType: 'application/json',
        text: graphqlBody,
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: graphqlBody.length,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'post',
      path: '/graphql',
    })

    assert('data' in response)
    expect(response.data).toBe(graphqlBody)
  })

  it('preserves path information', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/api/v1/users/123',
    })

    expect(response.path).toBe('/api/v1/users/123')
  })

  it('handles empty string body', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
        text: '',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: 0,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'get',
      path: '/test',
    })

    assert('data' in response)
    expect(response.data).toBe('')
    expect(response.size).toBe(0)
  })

  it('handles response with CORS headers', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Access-Control-Allow-Origin', value: '*' },
        { name: 'Access-Control-Allow-Methods', value: 'GET, POST, PUT, DELETE' },
        { name: 'Access-Control-Allow-Headers', value: 'Content-Type, Authorization' },
      ],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'application/json',
      },
      redirectURL: '',
      headersSize: -1,
      bodySize: -1,
    }

    const response = harToFetchResponse({
      harResponse,
      method: 'options',
      path: '/users',
    })

    expect(response.headers['access-control-allow-origin']).toBe('*')
    expect(response.headers['access-control-allow-methods']).toBe('GET, POST, PUT, DELETE')
    expect(response.headers['access-control-allow-headers']).toBe('Content-Type, Authorization')
  })
})
