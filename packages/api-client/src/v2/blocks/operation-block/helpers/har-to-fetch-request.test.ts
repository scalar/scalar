import type { HarRequest } from '@scalar/snippetz'
import { describe, expect, it } from 'vitest'

import { harToFetchRequest } from './har-to-fetch-request'

describe('harToFetchRequest', () => {
  it('converts basic GET request from HAR to Fetch Request', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('GET')
    expect(request.url).toBe('https://api.example.com/users')
  })

  it('converts POST request with JSON body', async () => {
    const jsonBody = JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: jsonBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    expect(request.headers.get('Content-Type')).toBe('application/json')

    const bodyText = await request.text()
    expect(bodyText).toBe(jsonBody)
  })

  it('converts headers from HAR to Fetch Request', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'X-Custom-Header', value: 'custom-value' },
        { name: 'Accept', value: 'application/json' },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Authorization')).toBe('Bearer token123')
    expect(request.headers.get('X-Custom-Header')).toBe('custom-value')
    expect(request.headers.get('Accept')).toBe('application/json')
  })

  it('converts cookies to Cookie header', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [
        { name: 'session_id', value: 'abc123' },
        { name: 'theme', value: 'dark' },
        { name: 'user_id', value: '42' },
      ],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Cookie')).toBe('session_id=abc123; theme=dark; user_id=42')
  })

  it('handles empty cookies array', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Cookie')).toBeNull()
  })

  it('converts URL-encoded form data from params', async () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/login',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'username', value: 'johndoe' },
          { name: 'password', value: 'secret123' },
        ],
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')

    const bodyText = await request.text()
    expect(bodyText).toBe('username=johndoe&password=secret123')
  })

  it('converts multipart form data from params', async () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/upload',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          { name: 'username', value: 'johndoe' },
          { name: 'file', value: '@avatar.png' },
        ],
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')

    // FormData body
    const formData = await request.formData()
    expect(formData.get('username')).toBe('johndoe')
    expect(formData.get('file')).toBe('@avatar.png')
  })

  it('handles empty params array', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [],
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.body).toBeNull()
  })

  it('handles postData with text only', async () => {
    const xmlBody = '<?xml version="1.0"?><user><name>John</name></user>'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/xml' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/xml',
        text: xmlBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe(xmlBody)
  })

  it('handles request without postData', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.body).toBeNull()
  })

  it('handles PUT request with body', async () => {
    const body = JSON.stringify({ status: 'active' })
    const harRequest: HarRequest = {
      method: 'PUT',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: body,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('PUT')
    const bodyText = await request.text()
    expect(bodyText).toBe(body)
  })

  it('handles PATCH request with body', async () => {
    const body = JSON.stringify({ name: 'Updated Name' })
    const harRequest: HarRequest = {
      method: 'PATCH',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: body,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('PATCH')
    const bodyText = await request.text()
    expect(bodyText).toBe(body)
  })

  it('handles DELETE request', () => {
    const harRequest: HarRequest = {
      method: 'DELETE',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('DELETE')
    expect(request.body).toBeNull()
  })

  it('handles URL with query parameters', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?page=1&limit=10',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [
        { name: 'page', value: '1' },
        { name: 'limit', value: '10' },
      ],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.url).toBe('https://api.example.com/users?page=1&limit=10')
  })

  it('handles multiple headers with same name', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    // Headers.get() returns comma-separated values for duplicate headers
    expect(request.headers.get('X-Custom')).toBe('value1, value2')
  })

  it('handles empty body text', async () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: '',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe('')
  })

  it('handles params with empty values', async () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/form',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'field1', value: 'value1' },
          { name: 'field2', value: '' },
          { name: 'field3', value: 'value3' },
        ],
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe('field1=value1&field2=&field3=value3')
  })

  it('handles plain text body', async () => {
    const textBody = 'This is plain text content'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/notes',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'text/plain',
        text: textBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe(textBody)
  })

  it('handles UTF-8 encoded content', async () => {
    const body = JSON.stringify({ message: '你好世界' })
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/messages',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json; charset=utf-8' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: body,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe(body)
  })

  it('handles cookies with special characters', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [
        { name: 'user_name', value: 'John Doe' },
        { name: 'session', value: 'abc-123-xyz' },
      ],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Cookie')).toBe('user_name=John Doe; session=abc-123-xyz')
  })

  it('handles complex combination of headers, cookies, and body', async () => {
    const jsonBody = JSON.stringify({ data: 'test' })
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/data?filter=active',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Request-ID', value: 'req-123' },
      ],
      queryString: [{ name: 'filter', value: 'active' }],
      cookies: [
        { name: 'session', value: 'abc123' },
        { name: 'tracking', value: 'xyz789' },
      ],
      postData: {
        mimeType: 'application/json',
        text: jsonBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    expect(request.url).toBe('https://api.example.com/data?filter=active')
    expect(request.headers.get('Authorization')).toBe('Bearer token123')
    expect(request.headers.get('Content-Type')).toBe('application/json')
    expect(request.headers.get('X-Request-ID')).toBe('req-123')
    expect(request.headers.get('Cookie')).toBe('session=abc123; tracking=xyz789')

    const bodyText = await request.text()
    expect(bodyText).toBe(jsonBody)
  })

  it('handles URL with port number', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com:8080/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.url).toBe('https://api.example.com:8080/users')
  })

  it('handles GraphQL request', async () => {
    const graphqlBody = JSON.stringify({
      query: 'query { user(id: "123") { name email } }',
    })
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/graphql',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: graphqlBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    const bodyText = await request.text()
    expect(bodyText).toBe(graphqlBody)
  })

  it('handles form with multiple values for same field', async () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/form',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'tag', value: 'javascript' },
          { name: 'tag', value: 'typescript' },
          { name: 'tag', value: 'vue' },
        ],
      },
      headersSize: -1,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    const bodyText = await request.text()
    expect(bodyText).toBe('tag=javascript&tag=typescript&tag=vue')
  })
})
