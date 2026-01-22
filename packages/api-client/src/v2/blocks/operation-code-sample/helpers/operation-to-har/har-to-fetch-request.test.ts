import type { Request as HarRequest } from 'har-format'
import { describe, expect, it } from 'vitest'

import { fetchRequestToHar } from '../../../../../../../workspace-store/src/mutators/fetch-request-to-har'
import { harToFetchRequest } from './har-to-fetch-request'

describe('harToFetchRequest', () => {
  it('converts a basic HAR request with JSON body to Fetch Request', async () => {
    const jsonBody = JSON.stringify({ message: 'Hello, World!' })
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Content-Length', value: String(jsonBody.length) },
      ],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/json',
        text: btoa(jsonBody),
      },
      headersSize: 50,
      bodySize: jsonBody.length,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    expect(request.url).toBe('https://api.example.com/users')
    expect(request.headers.get('Content-Type')).toBe('application/json')

    const body = await request.text()
    expect(body).toBe(jsonBody)
  })

  it('converts a GET request without body', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?page=1&limit=10',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'Authorization', value: 'Bearer token123' },
      ],
      cookies: [],
      queryString: [
        { name: 'page', value: '1' },
        { name: 'limit', value: '10' },
      ],
      headersSize: 60,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('GET')
    expect(request.url).toBe('https://api.example.com/users?page=1&limit=10')
    expect(request.headers.get('Accept')).toBe('application/json')
    expect(request.headers.get('Authorization')).toBe('Bearer token123')
  })

  it('converts binary content (file upload) from HAR to Fetch Request', async () => {
    // PNG header signature
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const base64Content = btoa(String.fromCharCode(...pngHeader))

    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/upload',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'image/png' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'image/png',
        text: base64Content,
      },
      headersSize: 30,
      bodySize: pngHeader.length,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    expect(request.headers.get('Content-Type')).toBe('image/png')

    const arrayBuffer = await request.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    expect(bytes).toEqual(pngHeader)
  })

  it('converts HTML form data from HAR to Fetch Request', async () => {
    const formBody = 'name=John+Doe&email=john%40example.com'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/submit',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        text: btoa(formBody),
      },
      headersSize: 40,
      bodySize: formBody.length,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('POST')
    expect(request.headers.get('Content-Type')).toBe('application/x-www-form-urlencoded')

    const body = await request.text()
    expect(body).toBe(formBody)
  })

  it('handles request without body (HEAD method)', () => {
    const harRequest: HarRequest = {
      method: 'HEAD',
      url: 'https://api.example.com/resource',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Accept', value: '*/*' }],
      cookies: [],
      queryString: [],
      headersSize: 20,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('HEAD')
    expect(request.url).toBe('https://api.example.com/resource')
  })

  it('handles DELETE request with empty body', () => {
    const harRequest: HarRequest = {
      method: 'DELETE',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Authorization', value: 'Bearer token123' }],
      cookies: [],
      queryString: [],
      headersSize: 30,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('DELETE')
    expect(request.url).toBe('https://api.example.com/users/123')
    expect(request.headers.get('Authorization')).toBe('Bearer token123')
  })

  it('preserves multiple headers', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/data',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'X-Custom-Header', value: 'custom-value' },
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'User-Agent', value: 'Mozilla/5.0' },
      ],
      cookies: [],
      queryString: [],
      headersSize: 100,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Accept')).toBe('application/json')
    expect(request.headers.get('X-Custom-Header')).toBe('custom-value')
    expect(request.headers.get('Authorization')).toBe('Bearer token123')
    expect(request.headers.get('User-Agent')).toBe('Mozilla/5.0')
  })

  it('handles non-base64 encoded plain text content', async () => {
    const plainText = 'This is plain text'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/text',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'text/plain',
        text: plainText,
      },
      headersSize: 30,
      bodySize: plainText.length,
    }

    const request = harToFetchRequest({ harRequest })

    const body = await request.text()
    expect(body).toBe(plainText)
  })

  it('round-trip conversion preserves data (Request -> HAR -> Request)', async () => {
    const originalBody = JSON.stringify({ test: 'data', nested: { value: 123 } })
    const originalRequest = new Request('https://api.example.com/test', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Header': 'test-value',
      },
      body: originalBody,
    })

    // Convert to HAR
    const harRequest = await fetchRequestToHar({ request: originalRequest })

    // Convert back to Request
    const reconstructedRequest = harToFetchRequest({ harRequest })

    // Verify they match
    expect(reconstructedRequest.method).toBe('POST')
    expect(reconstructedRequest.url).toBe('https://api.example.com/test')
    expect(reconstructedRequest.headers.get('Content-Type')).toBe('application/json')
    expect(reconstructedRequest.headers.get('X-Test-Header')).toBe('test-value')

    const reconstructedBody = await reconstructedRequest.text()
    expect(reconstructedBody).toBe(originalBody)
  })

  it('round-trip conversion works with binary content', async () => {
    // Create binary data (JPEG header)
    const binaryData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const originalRequest = new Request('https://api.example.com/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/jpeg',
      },
      body: binaryData,
    })

    // Convert to HAR
    const harRequest = await fetchRequestToHar({ request: originalRequest })

    // Convert back to Request
    const reconstructedRequest = harToFetchRequest({ harRequest })

    // Verify binary data matches
    const reconstructedBuffer = await reconstructedRequest.arrayBuffer()
    const reconstructedBytes = new Uint8Array(reconstructedBuffer)
    expect(reconstructedBytes).toEqual(binaryData)
  })

  it('handles PDF upload correctly', async () => {
    // PDF file header
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    const base64Pdf = btoa(String.fromCharCode(...pdfHeader))

    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/upload',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/pdf' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/pdf',
        text: base64Pdf,
      },
      headersSize: 30,
      bodySize: pdfHeader.length,
    }

    const request = harToFetchRequest({ harRequest })

    const arrayBuffer = await request.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    expect(bytes).toEqual(pdfHeader)
  })

  it('handles PUT request with JSON body', async () => {
    const jsonBody = JSON.stringify({ name: 'Updated Name', status: 'active' })
    const harRequest: HarRequest = {
      method: 'PUT',
      url: 'https://api.example.com/users/456',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Authorization', value: 'Bearer token123' },
      ],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/json',
        text: btoa(jsonBody),
      },
      headersSize: 60,
      bodySize: jsonBody.length,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('PUT')
    expect(request.url).toBe('https://api.example.com/users/456')

    const body = await request.json()
    expect(body).toEqual({ name: 'Updated Name', status: 'active' })
  })

  it('handles PATCH request with partial data', async () => {
    const jsonBody = JSON.stringify({ status: 'inactive' })
    const harRequest: HarRequest = {
      method: 'PATCH',
      url: 'https://api.example.com/users/789',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/json',
        text: btoa(jsonBody),
      },
      headersSize: 30,
      bodySize: jsonBody.length,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('PATCH')
    const body = await request.json()
    expect(body).toEqual({ status: 'inactive' })
  })

  it('handles large text content', async () => {
    // Create a large text body
    const largeText = 'A'.repeat(10000)
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/large',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'text/plain',
        text: btoa(largeText),
      },
      headersSize: 30,
      bodySize: largeText.length,
    }

    const request = harToFetchRequest({ harRequest })

    const body = await request.text()
    expect(body).toBe(largeText)
    expect(body.length).toBe(10000)
  })

  it('handles XML content', async () => {
    const xmlBody = '<?xml version="1.0"?><root><item>test</item></root>'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/xml',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/xml' }],
      cookies: [],
      queryString: [],
      postData: {
        mimeType: 'application/xml',
        text: btoa(xmlBody),
      },
      headersSize: 30,
      bodySize: xmlBody.length,
    }

    const request = harToFetchRequest({ harRequest })

    const body = await request.text()
    expect(body).toBe(xmlBody)
  })

  it('handles URL with complex query parameters', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/search?q=hello%20world&filter[type]=active&sort=-created',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Accept', value: 'application/json' }],
      cookies: [],
      queryString: [
        { name: 'q', value: 'hello world' },
        { name: 'filter[type]', value: 'active' },
        { name: 'sort', value: '-created' },
      ],
      headersSize: 30,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.url).toBe('https://api.example.com/search?q=hello%20world&filter[type]=active&sort=-created')
  })

  it('handles OPTIONS request (CORS preflight)', () => {
    const harRequest: HarRequest = {
      method: 'OPTIONS',
      url: 'https://api.example.com/resource',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Access-Control-Request-Method', value: 'POST' },
        { name: 'Access-Control-Request-Headers', value: 'Content-Type' },
        { name: 'Origin', value: 'https://example.com' },
      ],
      cookies: [],
      queryString: [],
      headersSize: 90,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.method).toBe('OPTIONS')
    expect(request.headers.get('Access-Control-Request-Method')).toBe('POST')
    expect(request.headers.get('Origin')).toBe('https://example.com')
  })

  it('handles request with cookie header', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/profile',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Cookie', value: 'session_id=abc123; user_id=456' },
        { name: 'Accept', value: 'application/json' },
      ],
      cookies: [
        { name: 'session_id', value: 'abc123' },
        { name: 'user_id', value: '456' },
      ],
      queryString: [],
      headersSize: 60,
      bodySize: -1,
    }

    const request = harToFetchRequest({ harRequest })

    expect(request.headers.get('Cookie')).toBe('session_id=abc123; user_id=456')
  })
})
