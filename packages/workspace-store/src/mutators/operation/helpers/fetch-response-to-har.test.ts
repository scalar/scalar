import { describe, expect, it } from 'vitest'

import { fetchResponseToHar, isTextBasedContent } from './fetch-response-to-har'

describe('fetchResponseToHar', () => {
  it('converts a basic successful response to HAR format', async () => {
    const response = new Response('{"message":"success"}', {
      status: 200,
      statusText: 'OK',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(200)
    expect(result.statusText).toBe('OK')
    expect(result.httpVersion).toBe('HTTP/1.1')
    expect(result.content.text).toBe('{"message":"success"}')
    expect(result.content.mimeType).toBe('application/json')
    expect(result.redirectURL).toBe('')
  })

  it('converts a 404 error response', async () => {
    const response = new Response('Not Found', {
      status: 404,
      statusText: 'Not Found',
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(404)
    expect(result.statusText).toBe('Not Found')
  })

  it('converts a 500 server error response', async () => {
    const response = new Response('Internal Server Error', {
      status: 500,
      statusText: 'Internal Server Error',
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(500)
    expect(result.statusText).toBe('Internal Server Error')
  })

  it('extracts headers from response', async () => {
    const response = new Response('test', {
      headers: {
        'Content-Type': 'text/plain',
        'X-Custom-Header': 'custom-value',
        'Cache-Control': 'no-cache',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.headers).toContainEqual({ name: 'content-type', value: 'text/plain' })
    expect(result.headers).toContainEqual({ name: 'x-custom-header', value: 'custom-value' })
    expect(result.headers).toContainEqual({ name: 'cache-control', value: 'no-cache' })
  })

  it('calculates headers size correctly', async () => {
    const response = new Response('test', {
      headers: {
        'X-Test': 'value',
      },
    })

    const result = await fetchResponseToHar({ response })

    // Header size = name.length + ': '.length + value.length + '\r\n'.length
    // 'X-Test' (6) + ': ' (2) + 'value' (5) + '\r\n' (2) = 15
    expect(result.headersSize).toBeGreaterThanOrEqual(15)
  })

  it('parses Set-Cookie header into cookies array', async () => {
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'session_id=abc123; Path=/; HttpOnly',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.cookies).toContainEqual({
      name: 'session_id',
      value: 'abc123',
    })
  })

  it('handles multiple Set-Cookie headers', async () => {
    const headers = new Headers()
    headers.append('Set-Cookie', 'session_id=abc123; Path=/')
    headers.append('Set-Cookie', 'theme=dark; Path=/')

    const response = new Response('test', { headers })

    const result = await fetchResponseToHar({ response })

    expect(result.cookies).toContainEqual({ name: 'session_id', value: 'abc123' })
    expect(result.cookies).toContainEqual({ name: 'theme', value: 'dark' })
  })

  it('extracts redirect URL from Location header', async () => {
    const response = new Response(null, {
      status: 302,
      statusText: 'Found',
      headers: {
        'Location': 'https://example.com/redirect',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.redirectURL).toBe('https://example.com/redirect')
    expect(result.status).toBe(302)
  })

  it('handles response without Location header', async () => {
    const response = new Response('test', {
      status: 200,
    })

    const result = await fetchResponseToHar({ response })

    expect(result.redirectURL).toBe('')
  })

  it('converts JSON response body', async () => {
    const body = { name: 'John Doe', email: 'john@example.com' }
    const response = new Response(JSON.stringify(body), {
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('application/json')
    expect(result.content.text).toBe(JSON.stringify(body))
    expect(result.bodySize).toBe(JSON.stringify(body).length)
  })

  it('converts HTML response body', async () => {
    const html = '<html><body>Hello World</body></html>'
    const response = new Response(html, {
      headers: {
        'Content-Type': 'text/html',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('text/html')
    expect(result.content.text).toBe(html)
  })

  it('converts XML response body', async () => {
    const xml = '<?xml version="1.0"?><user><name>John</name></user>'
    const response = new Response(xml, {
      headers: {
        'Content-Type': 'application/xml',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('application/xml')
    expect(result.content.text).toBe(xml)
  })

  it('converts plain text response body', async () => {
    const text = 'Hello, World!'
    const response = new Response(text, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('text/plain')
    expect(result.content.text).toBe(text)
  })

  it('skips binary content (images)', async () => {
    const binaryData = new Uint8Array([0xff, 0xd8, 0xff, 0xe0])
    const response = new Response(binaryData, {
      headers: {
        'Content-Type': 'image/jpeg',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('skips binary content (application/octet-stream)', async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03])
    const response = new Response(binaryData, {
      headers: {
        'Content-Type': 'application/octet-stream',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('skips body when includeBody is false', async () => {
    const response = new Response('test data', {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({ response, includeBody: false })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('skips body when response has no body', async () => {
    const response = new Response(null, {
      status: 204,
      statusText: 'No Content',
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('enforces body size limit', async () => {
    const largeBody = 'x'.repeat(2000)
    const response = new Response(largeBody, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({
      response,
      bodySizeLimit: 1000,
    })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('includes body when size is exactly at limit', async () => {
    const body = 'x'.repeat(1000)
    const response = new Response(body, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({
      response,
      bodySizeLimit: 1000,
    })

    expect(result.content.text).toBe(body)
    expect(result.bodySize).toBe(1000)
  })

  it('uses custom HTTP version when provided', async () => {
    const response = new Response('test')

    const result = await fetchResponseToHar({
      response,
      httpVersion: 'HTTP/2',
    })

    expect(result.httpVersion).toBe('HTTP/2')
  })

  it('defaults content type to text/plain when not specified', async () => {
    const response = new Response('test')

    const result = await fetchResponseToHar({ response })

    // Response constructor adds charset by default
    expect(result.content.mimeType).toContain('text/plain')
  })

  it('handles response with charset in content type', async () => {
    const response = new Response('test', {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('application/json; charset=utf-8')
  })

  it('handles UTF-8 encoded body correctly', async () => {
    const body = JSON.stringify({ message: '你好世界' })
    const response = new Response(body, {
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe(body)
    expect(result.bodySize).toBe(new TextEncoder().encode(body).length)
  })

  it('clones response when reading body to avoid consuming original', async () => {
    const body = 'test data'
    const response = new Response(body, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    // First conversion
    await fetchResponseToHar({ response })

    // Second conversion on the same response - should still work because we clone
    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe(body)
  })

  it('handles response with no headers', async () => {
    const response = new Response('test')

    const result = await fetchResponseToHar({ response })

    expect(result.headers).toBeDefined()
    expect(Array.isArray(result.headers)).toBe(true)
  })

  it('handles 201 Created response', async () => {
    const response = new Response('{"id": 123}', {
      status: 201,
      statusText: 'Created',
      headers: {
        'Content-Type': 'application/json',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(201)
    expect(result.statusText).toBe('Created')
  })

  it('handles 204 No Content response', async () => {
    const response = new Response(null, {
      status: 204,
      statusText: 'No Content',
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(204)
    expect(result.statusText).toBe('No Content')
    expect(result.bodySize).toBe(-1)
  })

  it('handles 301 Moved Permanently response', async () => {
    const response = new Response(null, {
      status: 301,
      statusText: 'Moved Permanently',
      headers: {
        'Location': 'https://example.com/new-location',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(301)
    expect(result.redirectURL).toBe('https://example.com/new-location')
  })

  it('handles 401 Unauthorized response', async () => {
    const response = new Response('Unauthorized', {
      status: 401,
      statusText: 'Unauthorized',
      headers: {
        'WWW-Authenticate': 'Bearer realm="example"',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.status).toBe(401)
    expect(result.headers).toContainEqual({
      name: 'www-authenticate',
      value: 'Bearer realm="example"',
    })
  })

  it('handles Set-Cookie with multiple attributes', async () => {
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'sessionId=xyz789; Path=/; Secure; HttpOnly; SameSite=Strict',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.cookies).toContainEqual({
      name: 'sessionId',
      value: 'xyz789',
    })
  })

  it('handles Set-Cookie with empty value', async () => {
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'deleted=; Path=/; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.cookies).toContainEqual({
      name: 'deleted',
      value: '',
    })
  })

  it('handles malformed Set-Cookie header gracefully', async () => {
    const response = new Response('test', {
      headers: {
        'Set-Cookie': 'invalid-cookie-without-equals',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.cookies).toEqual([])
  })

  it('handles CSS response', async () => {
    const css = 'body { color: red; }'
    const response = new Response(css, {
      headers: {
        'Content-Type': 'text/css',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('text/css')
    expect(result.content.text).toBe(css)
  })

  it('handles JavaScript response', async () => {
    const js = 'console.log("hello");'
    const response = new Response(js, {
      headers: {
        'Content-Type': 'application/javascript',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.mimeType).toBe('application/javascript')
    expect(result.content.text).toBe(js)
  })

  it('handles GraphQL response', async () => {
    const graphql = '{"data":{"user":{"name":"John"}}}'
    const response = new Response(graphql, {
      headers: {
        'Content-Type': 'application/graphql',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe(graphql)
  })

  it('handles form-encoded response', async () => {
    const formData = 'key1=value1&key2=value2'
    const response = new Response(formData, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe(formData)
  })

  it('uses default body size limit of 1MB', async () => {
    const smallBody = 'test'
    const response = new Response(smallBody, {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({ response })

    // Should include body since it's under 1MB default limit
    expect(result.content.text).toBe(smallBody)
    expect(result.bodySize).toBe(smallBody.length)
  })

  it('handles empty response body', async () => {
    const response = new Response('', {
      headers: {
        'Content-Type': 'text/plain',
      },
    })

    const result = await fetchResponseToHar({ response })

    expect(result.content.text).toBe('')
    expect(result.bodySize).toBe(0)
  })

  it('handles response with multiple headers of same name', async () => {
    const headers = new Headers()
    headers.append('X-Custom', 'value1')
    headers.append('X-Custom', 'value2')

    const response = new Response('test', { headers })

    const result = await fetchResponseToHar({ response })

    // Headers.entries() will combine multiple values with comma
    const customHeader = result.headers.find((h) => h.name === 'x-custom')
    expect(customHeader?.value).toBe('value1, value2')
  })
})

describe('isTextBasedContent', () => {
  it('identifies text/plain as text-based', () => {
    expect(isTextBasedContent('text/plain')).toBe(true)
  })

  it('identifies text/html as text-based', () => {
    expect(isTextBasedContent('text/html')).toBe(true)
  })

  it('identifies text/css as text-based', () => {
    expect(isTextBasedContent('text/css')).toBe(true)
  })

  it('identifies text/javascript as text-based', () => {
    expect(isTextBasedContent('text/javascript')).toBe(true)
  })

  it('identifies application/json as text-based', () => {
    expect(isTextBasedContent('application/json')).toBe(true)
  })

  it('identifies application/json with charset as text-based', () => {
    expect(isTextBasedContent('application/json; charset=utf-8')).toBe(true)
  })

  it('identifies application/xml as text-based', () => {
    expect(isTextBasedContent('application/xml')).toBe(true)
  })

  it('identifies text/xml as text-based', () => {
    expect(isTextBasedContent('text/xml')).toBe(true)
  })

  it('identifies application/javascript as text-based', () => {
    expect(isTextBasedContent('application/javascript')).toBe(true)
  })

  it('identifies application/x-javascript as text-based', () => {
    expect(isTextBasedContent('application/x-javascript')).toBe(true)
  })

  it('identifies application/x-www-form-urlencoded as text-based', () => {
    expect(isTextBasedContent('application/x-www-form-urlencoded')).toBe(true)
  })

  it('identifies application/graphql as text-based', () => {
    expect(isTextBasedContent('application/graphql')).toBe(true)
  })

  it('identifies application/ld+json as text-based', () => {
    expect(isTextBasedContent('application/ld+json')).toBe(true)
  })

  it('identifies application/hal+json as text-based', () => {
    expect(isTextBasedContent('application/hal+json')).toBe(true)
  })

  it('identifies application/vnd.api+json as text-based', () => {
    expect(isTextBasedContent('application/vnd.api+json')).toBe(true)
  })

  it('identifies application/atom+xml as text-based', () => {
    expect(isTextBasedContent('application/atom+xml')).toBe(true)
  })

  it('identifies application/rss+xml as text-based', () => {
    expect(isTextBasedContent('application/rss+xml')).toBe(true)
  })

  it('identifies application/soap+xml as text-based', () => {
    expect(isTextBasedContent('application/soap+xml')).toBe(true)
  })

  it('rejects image/jpeg as non-text-based', () => {
    expect(isTextBasedContent('image/jpeg')).toBe(false)
  })

  it('rejects image/png as non-text-based', () => {
    expect(isTextBasedContent('image/png')).toBe(false)
  })

  it('rejects image/gif as non-text-based', () => {
    expect(isTextBasedContent('image/gif')).toBe(false)
  })

  it('rejects application/octet-stream as non-text-based', () => {
    expect(isTextBasedContent('application/octet-stream')).toBe(false)
  })

  it('rejects application/pdf as non-text-based', () => {
    expect(isTextBasedContent('application/pdf')).toBe(false)
  })

  it('rejects application/zip as non-text-based', () => {
    expect(isTextBasedContent('application/zip')).toBe(false)
  })

  it('rejects audio/mpeg as non-text-based', () => {
    expect(isTextBasedContent('audio/mpeg')).toBe(false)
  })

  it('rejects video/mp4 as non-text-based', () => {
    expect(isTextBasedContent('video/mp4')).toBe(false)
  })

  it('handles case-insensitive content types', () => {
    expect(isTextBasedContent('TEXT/PLAIN')).toBe(true)
    expect(isTextBasedContent('APPLICATION/JSON')).toBe(true)
    expect(isTextBasedContent('Image/JPEG')).toBe(false)
  })

  it('handles content types with parameters', () => {
    expect(isTextBasedContent('text/html; charset=utf-8')).toBe(true)
    expect(isTextBasedContent('application/json; charset=utf-8; boundary=something')).toBe(true)
  })
})
