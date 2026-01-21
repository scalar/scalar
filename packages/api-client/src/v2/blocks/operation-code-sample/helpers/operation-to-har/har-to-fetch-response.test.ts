import type { Response as HarResponse } from 'har-format'
import { describe, expect, it } from 'vitest'

import { fetchResponseToHar } from '../../../../../../../workspace-store/src/mutators/fetch-response-to-har'
import { harToFetchResponse } from './har-to-fetch-response'

describe('harToFetchResponse', () => {
  it('converts a basic HAR response with JSON to Fetch Response', async () => {
    const jsonBody = JSON.stringify({ message: 'Hello, World!' })
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Content-Length', value: String(jsonBody.length) },
      ],
      cookies: [],
      content: {
        size: jsonBody.length,
        mimeType: 'application/json',
        text: btoa(jsonBody),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 50,
      bodySize: jsonBody.length,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(200)
    expect(response.statusText).toBe('OK')
    expect(response.headers.get('Content-Type')).toBe('application/json')

    const body = await response.text()
    expect(body).toBe(jsonBody)
  })

  it('converts binary content (PNG image) from HAR to Fetch Response', async () => {
    // PNG header signature
    const pngHeader = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const base64Content = btoa(String.fromCharCode(...pngHeader))

    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'image/png' }],
      cookies: [],
      content: {
        size: pngHeader.length,
        mimeType: 'image/png',
        text: base64Content,
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: pngHeader.length,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('image/png')

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    expect(bytes).toEqual(pngHeader)
  })

  it('converts HTML content from HAR to Fetch Response', async () => {
    const htmlBody = '<html><body><h1>Hello</h1></body></html>'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/html; charset=utf-8' }],
      cookies: [],
      content: {
        size: htmlBody.length,
        mimeType: 'text/html; charset=utf-8',
        text: btoa(htmlBody),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 40,
      bodySize: htmlBody.length,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(200)
    expect(response.headers.get('Content-Type')).toBe('text/html; charset=utf-8')

    const body = await response.text()
    expect(body).toBe(htmlBody)
  })

  it('handles empty response body', async () => {
    const harResponse: HarResponse = {
      status: 204,
      statusText: 'No Content',
      httpVersion: 'HTTP/1.1',
      headers: [],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'application/octet-stream',
        text: '',
      },
      redirectURL: '',
      headersSize: 20,
      bodySize: 0,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(204)
    expect(response.statusText).toBe('No Content')

    const body = await response.text()
    expect(body).toBe('')
  })

  it('handles error responses (404)', async () => {
    const errorBody = JSON.stringify({ error: 'Not Found' })
    const harResponse: HarResponse = {
      status: 404,
      statusText: 'Not Found',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      cookies: [],
      content: {
        size: errorBody.length,
        mimeType: 'application/json',
        text: btoa(errorBody),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: errorBody.length,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(404)
    expect(response.statusText).toBe('Not Found')

    const body = await response.json()
    expect(body).toEqual({ error: 'Not Found' })
  })

  it('preserves multiple headers', () => {
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'X-Custom-Header', value: 'custom-value' },
        { name: 'Authorization', value: 'Bearer token123' },
      ],
      cookies: [],
      content: {
        size: 4,
        mimeType: 'application/json',
        text: btoa('test'),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 80,
      bodySize: 4,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.headers.get('Content-Type')).toBe('application/json')
    expect(response.headers.get('X-Custom-Header')).toBe('custom-value')
    expect(response.headers.get('Authorization')).toBe('Bearer token123')
  })

  it('handles non-base64 encoded text content', async () => {
    const plainText = 'This is plain text'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      cookies: [],
      content: {
        size: plainText.length,
        mimeType: 'text/plain',
        text: plainText,
        // No encoding field means plain text
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: plainText.length,
    }

    const response = harToFetchResponse({ harResponse })

    const body = await response.text()
    expect(body).toBe(plainText)
  })

  it('round-trip conversion preserves data (Response -> HAR -> Response)', async () => {
    const originalBody = JSON.stringify({ test: 'data', nested: { value: 123 } })
    const originalResponse = new Response(originalBody, {
      status: 201,
      statusText: 'Created',
      headers: {
        'Content-Type': 'application/json',
        'X-Test-Header': 'test-value',
      },
    })

    // Convert to HAR
    const harResponse = await fetchResponseToHar({ response: originalResponse })

    // Convert back to Response
    const reconstructedResponse = harToFetchResponse({ harResponse })

    // Verify they match
    expect(reconstructedResponse.status).toBe(201)
    expect(reconstructedResponse.statusText).toBe('Created')
    expect(reconstructedResponse.headers.get('Content-Type')).toBe('application/json')
    expect(reconstructedResponse.headers.get('X-Test-Header')).toBe('test-value')

    const reconstructedBody = await reconstructedResponse.text()
    expect(reconstructedBody).toBe(originalBody)
  })

  it('round-trip conversion works with binary content', async () => {
    // Create binary data
    const binaryData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10])
    const originalResponse = new Response(binaryData, {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'image/jpeg',
      },
    })

    // Convert to HAR
    const harResponse = await fetchResponseToHar({ response: originalResponse })

    // Convert back to Response
    const reconstructedResponse = harToFetchResponse({ harResponse })

    // Verify binary data matches
    const reconstructedBuffer = await reconstructedResponse.arrayBuffer()
    const reconstructedBytes = new Uint8Array(reconstructedBuffer)
    expect(reconstructedBytes).toEqual(binaryData)
  })

  it('handles PDF content correctly', async () => {
    // PDF file header
    const pdfHeader = new Uint8Array([0x25, 0x50, 0x44, 0x46, 0x2d])
    const base64Pdf = btoa(String.fromCharCode(...pdfHeader))

    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/pdf' }],
      cookies: [],
      content: {
        size: pdfHeader.length,
        mimeType: 'application/pdf',
        text: base64Pdf,
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: pdfHeader.length,
    }

    const response = harToFetchResponse({ harResponse })

    const arrayBuffer = await response.arrayBuffer()
    const bytes = new Uint8Array(arrayBuffer)
    expect(bytes).toEqual(pdfHeader)
  })

  it('handles redirect responses with Location header', () => {
    const harResponse: HarResponse = {
      status: 302,
      statusText: 'Found',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Location', value: 'https://example.com/redirected' }],
      cookies: [],
      content: {
        size: 0,
        mimeType: 'text/plain',
        text: '',
      },
      redirectURL: 'https://example.com/redirected',
      headersSize: 40,
      bodySize: 0,
    }

    const response = harToFetchResponse({ harResponse })

    expect(response.status).toBe(302)
    expect(response.statusText).toBe('Found')
    expect(response.headers.get('Location')).toBe('https://example.com/redirected')
  })

  it('handles large text content', async () => {
    // Create a large text body
    const largeText = 'A'.repeat(10000)
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'text/plain' }],
      cookies: [],
      content: {
        size: largeText.length,
        mimeType: 'text/plain',
        text: btoa(largeText),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: largeText.length,
    }

    const response = harToFetchResponse({ harResponse })

    const body = await response.text()
    expect(body).toBe(largeText)
    expect(body.length).toBe(10000)
  })

  it('handles XML content', async () => {
    const xmlBody = '<?xml version="1.0"?><root><item>test</item></root>'
    const harResponse: HarResponse = {
      status: 200,
      statusText: 'OK',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/xml' }],
      cookies: [],
      content: {
        size: xmlBody.length,
        mimeType: 'application/xml',
        text: btoa(xmlBody),
        encoding: 'base64',
      },
      redirectURL: '',
      headersSize: 30,
      bodySize: xmlBody.length,
    }

    const response = harToFetchResponse({ harResponse })

    const body = await response.text()
    expect(body).toBe(xmlBody)
  })
})
