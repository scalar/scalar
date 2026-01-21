import { describe, expect, it } from 'vitest'

import { fetchRequestToHar } from './fetch-request-to-har'

describe('fetchRequestToHar', () => {
  it('converts a basic GET request to HAR format', async () => {
    const request = new Request('https://api.example.com/users?page=1&limit=10', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
      },
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.method).toBe('GET')
    expect(harRequest.url).toBe('https://api.example.com/users?page=1&limit=10')
    expect(harRequest.httpVersion).toBe('HTTP/1.1')
    expect(harRequest.headers).toHaveLength(1)
    expect(harRequest.queryString).toHaveLength(2)
    expect(harRequest.queryString).toContainEqual({ name: 'page', value: '1' })
    expect(harRequest.queryString).toContainEqual({ name: 'limit', value: '10' })
    expect(harRequest.headersSize).toBeGreaterThan(0)
  })

  it('converts a POST request with JSON body to HAR format', async () => {
    const body = JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.method).toBe('POST')
    expect(harRequest.postData).toBeDefined()
    expect(harRequest.postData?.mimeType).toBe('application/json')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
    expect(harRequest.bodySize).toBe(body.length)
  })

  it('converts request headers to array format', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        Authorization: 'Bearer token123',
        'X-Custom-Header': 'custom-value',
      },
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.headers).toHaveLength(3)
    expect(harRequest.headers.some((h) => h.name === 'accept')).toBe(true)
    expect(harRequest.headers.some((h) => h.name === 'authorization')).toBe(true)
    expect(harRequest.headers.some((h) => h.name === 'x-custom-header')).toBe(true)
  })

  it('parses Cookie headers into cookies array', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
      headers: {
        Cookie: 'session_id=abc123; user_pref=dark_mode',
      },
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.cookies).toHaveLength(2)
    expect(harRequest.cookies).toContainEqual({ name: 'session_id', value: 'abc123' })
    expect(harRequest.cookies).toContainEqual({ name: 'user_pref', value: 'dark_mode' })
  })

  it('extracts query string from URL', async () => {
    const request = new Request('https://api.example.com/search?q=test&sort=asc&filter=active', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.queryString).toHaveLength(3)
    expect(harRequest.queryString).toContainEqual({ name: 'q', value: 'test' })
    expect(harRequest.queryString).toContainEqual({ name: 'sort', value: 'asc' })
    expect(harRequest.queryString).toContainEqual({ name: 'filter', value: 'active' })
  })

  it('handles requests without a body', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData).toBeUndefined()
    expect(harRequest.bodySize).toBe(-1)
  })

  it('handles DELETE requests', async () => {
    const request = new Request('https://api.example.com/users/123', {
      method: 'DELETE',
      headers: {
        Authorization: 'Bearer token123',
      },
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.method).toBe('DELETE')
    expect(harRequest.url).toBe('https://api.example.com/users/123')
  })

  it('handles PUT requests with body', async () => {
    const body = JSON.stringify({ name: 'Jane Doe' })
    const request = new Request('https://api.example.com/users/123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.method).toBe('PUT')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles PATCH requests', async () => {
    const body = JSON.stringify({ email: 'newemail@example.com' })
    const request = new Request('https://api.example.com/users/123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.method).toBe('PATCH')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('respects includeBody option when set to false', async () => {
    const body = JSON.stringify({ data: 'should not be included' })
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({
      request,
      includeBody: false,
    })

    expect(harRequest.postData).toBeUndefined()
    expect(harRequest.bodySize).toBe(-1)
  })

  it('allows custom HTTP version', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({
      request,
      httpVersion: 'HTTP/2.0',
    })

    expect(harRequest.httpVersion).toBe('HTTP/2.0')
  })

  it('calculates header size correctly', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
      headers: {
        Accept: 'application/json',
        'X-Test': 'value',
      },
    })

    const harRequest = await fetchRequestToHar({ request })

    // Each header contributes: name.length + ": " + value.length + "\r\n"
    // accept: application/json\r\n = 6 + 2 + 16 + 2 = 26
    // x-test: value\r\n = 6 + 2 + 5 + 2 = 15
    // Total = 41
    expect(harRequest.headersSize).toBe(41)
  })

  it('handles form-urlencoded body', async () => {
    const body = 'name=John+Doe&email=john%40example.com'
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('application/x-www-form-urlencoded')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles XML body as base64', async () => {
    const body = '<?xml version="1.0"?><root><item>test</item></root>'
    const request = new Request('https://api.example.com/data', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('application/xml')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles GraphQL body as base64', async () => {
    const body = JSON.stringify({ query: 'query { user { id name } }' })
    const request = new Request('https://api.example.com/graphql', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/graphql',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('application/graphql')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles binary body with base64 encoding', async () => {
    const buffer = new Uint8Array([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a])
    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'image/png',
      },
      body: buffer,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('image/png')
    expect(harRequest.bodySize).toBe(8)

    // Verify the base64 encoding is correct
    const expectedBase64 = btoa(String.fromCharCode(...buffer))
    expect(harRequest.postData?.text).toBe(expectedBase64)
  })

  it('handles text/plain body', async () => {
    const body = 'This is plain text content'
    const request = new Request('https://api.example.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('text/plain')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles text/html body', async () => {
    const body = '<html><body><h1>Hello</h1></body></html>'
    const request = new Request('https://api.example.com/html', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/html',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('text/html')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })

  it('handles URLs without query parameters', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.queryString).toHaveLength(0)
  })

  it('handles requests without cookies', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.cookies).toHaveLength(0)
  })

  it('does not consume the original request body', async () => {
    const body = 'test content'
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      body,
    })

    // Convert to HAR
    await fetchRequestToHar({ request })

    // Original request should still be readable
    const text = await request.text()
    expect(text).toBe(body)
  })

  it('handles multipart/form-data as binary with base64', async () => {
    const formData = new FormData()
    formData.append('file', new Blob(['content'], { type: 'text/plain' }), 'test.txt')

    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      body: formData,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData).toBeDefined()
    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
  })

  it('handles empty query string parameters', async () => {
    const request = new Request('https://api.example.com/search?q=&filter=', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.queryString).toHaveLength(2)
    expect(harRequest.queryString).toContainEqual({ name: 'q', value: '' })
    expect(harRequest.queryString).toContainEqual({ name: 'filter', value: '' })
  })

  it('handles special characters in query parameters', async () => {
    const request = new Request('https://api.example.com/search?q=hello%20world&filter=%2Bactive', {
      method: 'GET',
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.queryString).toContainEqual({ name: 'q', value: 'hello world' })
    expect(harRequest.queryString).toContainEqual({ name: 'filter', value: '+active' })
  })

  it('handles JavaScript content type as base64', async () => {
    const body = 'function test() { return true; }'
    const request = new Request('https://api.example.com/script', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/javascript',
      },
      body,
    })

    const harRequest = await fetchRequestToHar({ request })

    expect(harRequest.postData?.mimeType).toBe('application/javascript')
    expect(atob(harRequest.postData?.text ?? '')).toBe(body)
  })
})
