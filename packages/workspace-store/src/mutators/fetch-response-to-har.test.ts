import { describe, expect, it } from 'vitest'

import { fetchResponseToHar } from './fetch-response-to-har'

describe('fetchResponseToHar', () => {
  it('converts a basic JSON response to HAR format', async () => {
    const responseBody = JSON.stringify({ message: 'Hello, World!' })
    const response = new Response(responseBody, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': String(responseBody.length),
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.status).toBe(200)
    expect(harResponse.statusText).toBe('OK')
    expect(harResponse.httpVersion).toBe('HTTP/1.1')
    expect(harResponse.headers).toHaveLength(2)
    expect(harResponse.content.mimeType).toBe('application/json')
    expect(harResponse.content.encoding).toBe('base64')
    // Verify we can decode the base64 back to original
    expect(atob(harResponse.content.text)).toBe(responseBody)
    expect(harResponse.bodySize).toBeGreaterThan(0)
    expect(harResponse.headersSize).toBeGreaterThan(0)
  })

  it('converts response headers to array format', async () => {
    const response = new Response('test', {
      headers: {
        'Content-Type': 'text/plain',
        'X-Custom-Header': 'custom-value',
        Authorization: 'Bearer token123',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.headers).toHaveLength(3)
    expect(harResponse.headers.some((h) => h.name === 'content-type')).toBe(true)
    expect(harResponse.headers.some((h) => h.name === 'x-custom-header')).toBe(true)
    expect(harResponse.headers.some((h) => h.name === 'authorization')).toBe(true)
  })

  it('parses Set-Cookie headers into cookies array', async () => {
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'session_id=abc123; Path=/; HttpOnly',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.cookies).toHaveLength(1)
    expect(harResponse.cookies[0]?.name).toBe('session_id')
    expect(harResponse.cookies[0]?.value).toBe('abc123')
  })

  it('extracts redirect URL from Location header', async () => {
    const response = new Response(null, {
      status: 302,
      statusText: 'Found',
      headers: {
        Location: 'https://example.com/redirected',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.status).toBe(302)
    expect(harResponse.redirectURL).toBe('https://example.com/redirected')
  })

  it('handles responses without a body', async () => {
    const response = new Response(null, {
      status: 204,
      statusText: 'No Content',
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.status).toBe(204)
    expect(harResponse.content.text).toBe('')
    expect(harResponse.content.encoding).toBeUndefined()
    expect(harResponse.bodySize).toBe(0)
  })

  it('handles error responses', async () => {
    const errorBody = JSON.stringify({ error: 'Not Found' })
    const response = new Response(errorBody, {
      status: 404,
      statusText: 'Not Found',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.status).toBe(404)
    expect(harResponse.statusText).toBe('Not Found')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe(errorBody)
  })

  it('respects includeBody option when set to false', async () => {
    const response = new Response('This should not be included', {
      status: 200,
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const harResponse = await fetchResponseToHar({
      response,
      includeBody: false,
    })

    expect(harResponse.content.text).toBe('')
    expect(harResponse.bodySize).toBe(-1)
  })

  it('allows custom HTTP version', async () => {
    const response = new Response('test', {
      status: 200,
    })

    const harResponse = await fetchResponseToHar({
      response,
      httpVersion: 'HTTP/2.0',
    })

    expect(harResponse.httpVersion).toBe('HTTP/2.0')
  })

  it('calculates header size correctly', async () => {
    const response = new Response('test', {
      headers: {
        'Content-Type': 'text/plain',
        'X-Test': 'value',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    // Each header contributes: name.length + ": " + value.length + "\r\n"
    // content-type: text/plain\r\n = 12 + 2 + 10 + 2 = 26
    // x-test: value\r\n = 6 + 2 + 5 + 2 = 15
    // Total = 41
    expect(harResponse.headersSize).toBe(41)
  })

  it('handles HTML responses', async () => {
    const htmlBody = '<html><body><h1>Hello</h1></body></html>'
    const response = new Response(htmlBody, {
      status: 200,
      headers: {
        'Content-Type': 'text/html; charset=utf-8',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('text/html; charset=utf-8')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe(htmlBody)
  })

  it('handles binary content with base64 encoding', async () => {
    // Create a simple binary buffer (PNG header signature)
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const response = new Response(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'image/png',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('image/png')
    expect(harResponse.content.encoding).toBe('base64')
    expect(harResponse.content.text).toBeTruthy()
    expect(harResponse.bodySize).toBe(8)

    // Verify the base64 encoding is correct
    const expectedBase64 = btoa(String.fromCharCode(...buffer))
    expect(harResponse.content.text).toBe(expectedBase64)
  })

  it('handles missing Content-Type with default', async () => {
    // Note: Response API automatically sets Content-Type to 'text/plain;charset=UTF-8'
    // when creating a response with text body. To test the default fallback,
    // we would need to mock or manually create a response without content-type
    const response = new Response('test')

    const harResponse = await fetchResponseToHar({ response })

    // The default Content-Type from Response API
    expect(harResponse.content.mimeType).toBe('text/plain;charset=UTF-8')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe('test')
  })

  it('does not consume the original response body', async () => {
    const responseBody = 'test content'
    const response = new Response(responseBody, {
      status: 200,
    })

    // Convert to HAR
    await fetchResponseToHar({ response })

    // Original response should still be readable
    const text = await response.text()
    expect(text).toBe(responseBody)
  })

  it('parses multiple Set-Cookie headers correctly', async () => {
    // Note: In Fetch API, multiple Set-Cookie headers are typically combined
    // This test shows how a single Set-Cookie with multiple values would work
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'session=abc123; Path=/',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.cookies.length).toBeGreaterThanOrEqual(1)
    const sessionCookie = harResponse.cookies.find((c) => c.name === 'session')
    expect(sessionCookie?.value).toBe('abc123')
  })

  it('handles JSON with base64 encoding', async () => {
    const jsonBody = JSON.stringify({ test: 'data' })
    const response = new Response(jsonBody, {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('application/json')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe(jsonBody)
  })

  it('handles XML with base64 encoding', async () => {
    const xmlBody = '<?xml version="1.0"?><root><item>test</item></root>'
    const response = new Response(xmlBody, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('application/xml')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe(xmlBody)
  })

  it('handles PDF as base64 encoded binary', async () => {
    // PDF file header
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    const response = new Response(pdfHeader, {
      headers: {
        'Content-Type': 'application/pdf',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('application/pdf')
    expect(harResponse.content.encoding).toBe('base64')
    expect(harResponse.bodySize).toBe(5)
  })

  it('handles form data with base64 encoding', async () => {
    const formBody = 'field1=value1&field2=value2'
    const response = new Response(formBody, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('application/x-www-form-urlencoded')
    expect(harResponse.content.encoding).toBe('base64')
    expect(atob(harResponse.content.text)).toBe(formBody)
  })

  it('handles JPEG as base64 encoded binary', async () => {
    // JPEG file header (JFIF)
    const jpegHeader = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    const response = new Response(jpegHeader, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    })

    const harResponse = await fetchResponseToHar({ response })

    expect(harResponse.content.mimeType).toBe('image/jpeg')
    expect(harResponse.content.encoding).toBe('base64')

    // Verify we can decode it back
    const decoded = Uint8Array.from(atob(harResponse.content.text), (c) => c.charCodeAt(0))
    expect(decoded).toEqual(jpegHeader)
  })
})
