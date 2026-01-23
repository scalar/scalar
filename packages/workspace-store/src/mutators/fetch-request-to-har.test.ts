import { describe, expect, it } from 'vitest'

import { fetchRequestToHar } from './fetch-request-to-har'

describe('fetchRequestToHar', () => {
  it('converts a basic GET request to HAR format', async () => {
    const request = new Request('https://api.example.com/users')

    const result = await fetchRequestToHar({ request })

    expect(result.method).toBe('GET')
    expect(result.url).toBe('https://api.example.com/users')
    expect(result.httpVersion).toBe('HTTP/1.1')
    expect(result.headers).toEqual([])
    expect(result.queryString).toEqual([])
    expect(result.cookies).toEqual([])
    expect(result.bodySize).toBe(-1)
  })

  it('extracts query parameters from URL', async () => {
    const request = new Request('https://api.example.com/users?page=1&limit=10&sort=name')

    const result = await fetchRequestToHar({ request })

    expect(result.queryString).toEqual([
      { name: 'page', value: '1' },
      { name: 'limit', value: '10' },
      { name: 'sort', value: 'name' },
    ])
  })

  it('extracts headers from request', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        'Authorization': 'Bearer token123',
        'X-Custom-Header': 'custom-value',
        'Accept': 'application/json',
      },
    })

    const result = await fetchRequestToHar({ request })

    expect(result.headers).toContainEqual({ name: 'authorization', value: 'Bearer token123' })
    expect(result.headers).toContainEqual({ name: 'x-custom-header', value: 'custom-value' })
    expect(result.headers).toContainEqual({ name: 'accept', value: 'application/json' })
  })

  it('calculates headers size correctly', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        'X-Test': 'value',
      },
    })

    const result = await fetchRequestToHar({ request })

    // Header size = name.length + ': '.length + value.length + '\r\n'.length
    // 'X-Test' (6) + ': ' (2) + 'value' (5) + '\r\n' (2) = 15
    expect(result.headersSize).toBe(15)
  })

  it('extracts cookies from Cookie header', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        'Cookie': 'session_id=abc123; theme=dark; user_id=42',
      },
    })

    const result = await fetchRequestToHar({ request })

    expect(result.cookies).toEqual([
      { name: 'session_id', value: 'abc123' },
      { name: 'theme', value: 'dark' },
      { name: 'user_id', value: '42' },
    ])
    // Cookie header is not included in regular headers
    expect(result.headers.find((h) => h.name === 'cookie')).toBeUndefined()
  })

  it('handles malformed cookies gracefully', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        'Cookie': 'validcookie=value; invalidcookie; anothercookie=value2',
      },
    })

    const result = await fetchRequestToHar({ request })

    expect(result.cookies).toEqual([
      { name: 'validcookie', value: 'value' },
      { name: 'anothercookie', value: 'value2' },
    ])
  })

  it('converts POST request with JSON body to HAR format', async () => {
    const body = JSON.stringify({ name: 'John Doe', email: 'john@example.com' })
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.method).toBe('POST')
    expect(result.postData?.mimeType).toBe('application/json')
    expect(result.postData?.text).toBe(body)
    expect(result.bodySize).toBe(body.length)
  })

  it('extracts MIME type without charset', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body: '{}',
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.mimeType).toBe('application/json')
  })

  it('defaults MIME type to text/plain when not specified', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      body: 'plain text',
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.mimeType).toBe('text/plain')
  })

  it('converts POST request with form data to HAR params', async () => {
    const formData = new FormData()
    formData.append('username', 'johndoe')
    formData.append('password', 'secret123')
    formData.append('remember', 'true')

    const request = new Request('https://api.example.com/login', {
      method: 'POST',
      body: formData,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.params).toEqual([
      { name: 'username', value: 'johndoe' },
      { name: 'password', value: 'secret123' },
      { name: 'remember', value: 'true' },
    ])
  })

  it('converts POST request with URL-encoded form data to HAR params', async () => {
    const formData = new URLSearchParams()
    formData.append('email', 'test@example.com')
    formData.append('message', 'Hello World')

    const request = new Request('https://api.example.com/contact', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: formData,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.params).toEqual([
      { name: 'email', value: 'test@example.com' },
      { name: 'message', value: 'Hello World' },
    ])
  })

  it('handles file uploads in form data', async () => {
    const formData = new FormData()
    formData.append('username', 'johndoe')
    formData.append('avatar', new File(['file content'], 'avatar.png', { type: 'image/png' }))

    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      body: formData,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.params).toEqual([
      { name: 'username', value: 'johndoe' },
      { name: 'avatar', value: '@avatar.png' },
    ])
  })

  it('skips body when includeBody is false', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'John' }),
    })

    const result = await fetchRequestToHar({ request, includeBody: false })

    expect(result.postData?.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('skips body when request has no body', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'GET',
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('skips binary bodies (application/octet-stream)', async () => {
    const binaryData = new Uint8Array([0x00, 0x01, 0x02, 0x03])
    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/octet-stream',
      },
      body: binaryData,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('enforces body size limit', async () => {
    const largeBody = 'x'.repeat(2000)
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: largeBody,
    })

    const result = await fetchRequestToHar({
      request,
      bodySizeLimit: 1000,
    })

    expect(result.postData?.text).toBe('')
    expect(result.bodySize).toBe(-1)
  })

  it('includes body when size is exactly at limit', async () => {
    const body = 'x'.repeat(1000)
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body,
    })

    const result = await fetchRequestToHar({
      request,
      bodySizeLimit: 1000,
    })

    expect(result.postData?.text).toBe(body)
    expect(result.bodySize).toBe(1000)
  })

  it('uses custom HTTP version when provided', async () => {
    const request = new Request('https://api.example.com/users')

    const result = await fetchRequestToHar({
      request,
      httpVersion: 'HTTP/2',
    })

    expect(result.httpVersion).toBe('HTTP/2')
  })

  it('handles requests with multiple headers of same name', async () => {
    const headers = new Headers()
    headers.append('X-Custom', 'value1')
    headers.append('X-Custom', 'value2')

    const request = new Request('https://api.example.com/users', { headers })

    const result = await fetchRequestToHar({ request })

    // Headers.entries() will combine multiple values with comma
    const customHeader = result.headers.find((h) => h.name === 'x-custom')
    expect(customHeader?.value).toBe('value1, value2')
  })

  it('handles empty query string', async () => {
    const request = new Request('https://api.example.com/users?')

    const result = await fetchRequestToHar({ request })

    expect(result.queryString).toEqual([])
  })

  it('handles URL with fragment', async () => {
    const request = new Request('https://api.example.com/users#section')

    const result = await fetchRequestToHar({ request })

    // Fragments are not included in URL.searchParams
    expect(result.url).toBe('https://api.example.com/users#section')
    expect(result.queryString).toEqual([])
  })

  it('handles PUT request with body', async () => {
    const body = JSON.stringify({ status: 'active' })
    const request = new Request('https://api.example.com/users/123', {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.method).toBe('PUT')
    expect(result.postData?.text).toBe(body)
  })

  it('handles DELETE request', async () => {
    const request = new Request('https://api.example.com/users/123', {
      method: 'DELETE',
    })

    const result = await fetchRequestToHar({ request })

    expect(result.method).toBe('DELETE')
    expect(result.bodySize).toBe(-1)
  })

  it('handles PATCH request with body', async () => {
    const body = JSON.stringify({ name: 'Updated Name' })
    const request = new Request('https://api.example.com/users/123', {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.method).toBe('PATCH')
    expect(result.postData?.text).toBe(body)
  })

  it('handles request with XML body', async () => {
    const xmlBody = '<?xml version="1.0"?><user><name>John</name></user>'
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/xml',
      },
      body: xmlBody,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.mimeType).toBe('application/xml')
    expect(result.postData?.text).toBe(xmlBody)
  })

  it('handles empty body for POST request', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      body: '',
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.text).toBe('')
    expect(result.bodySize).toBe(0)
  })

  it('handles cookies with spaces in values', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        'Cookie': 'user_name=John Doe; session=abc 123',
      },
    })

    const result = await fetchRequestToHar({ request })

    expect(result.cookies).toEqual([
      { name: 'user_name', value: 'John Doe' },
      { name: 'session', value: 'abc 123' },
    ])
  })

  it('handles URL with port number', async () => {
    const request = new Request('https://api.example.com:8080/users?id=1')

    const result = await fetchRequestToHar({ request })

    expect(result.url).toBe('https://api.example.com:8080/users?id=1')
    expect(result.queryString).toEqual([{ name: 'id', value: '1' }])
  })

  it('handles request with no headers', async () => {
    const request = new Request('https://api.example.com/users')

    const result = await fetchRequestToHar({ request })

    expect(result.headers).toEqual([])
    expect(result.headersSize).toBe(0)
  })

  it('handles UTF-8 encoded body correctly', async () => {
    const body = JSON.stringify({ message: '你好世界' })
    const request = new Request('https://api.example.com/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json; charset=utf-8',
      },
      body,
    })

    const result = await fetchRequestToHar({ request })

    expect(result.postData?.text).toBe(body)
    expect(result.bodySize).toBe(new TextEncoder().encode(body).length)
  })

  it('clones request when reading body to avoid consuming original', async () => {
    const body = JSON.stringify({ test: 'data' })
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body,
    })

    // First conversion
    await fetchRequestToHar({ request })

    // Second conversion on the same request - should still work because we clone
    const result = await fetchRequestToHar({ request })

    expect(result.postData?.text).toBe(body)
  })

  it('handles query parameters with special characters', async () => {
    const request = new Request('https://api.example.com/search?q=hello%20world&filter=type%3Duser')

    const result = await fetchRequestToHar({ request })

    expect(result.queryString).toEqual([
      { name: 'q', value: 'hello world' },
      { name: 'filter', value: 'type=user' },
    ])
  })

  it('handles query parameters with empty values', async () => {
    const request = new Request('https://api.example.com/users?active=&premium=')

    const result = await fetchRequestToHar({ request })

    expect(result.queryString).toEqual([
      { name: 'active', value: '' },
      { name: 'premium', value: '' },
    ])
  })

  it('handles duplicate query parameters', async () => {
    const request = new Request('https://api.example.com/users?tag=javascript&tag=typescript&tag=vue')

    const result = await fetchRequestToHar({ request })

    // URL.searchParams.entries() handles duplicates
    expect(result.queryString.filter((q) => q.name === 'tag')).toHaveLength(3)
  })

  it('uses default body size limit of 1MB', async () => {
    const smallBody = 'test'
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      body: smallBody,
    })

    const result = await fetchRequestToHar({ request })

    // Should include body since it's under 1MB default limit
    expect(result.postData?.text).toBe(smallBody)
    expect(result.bodySize).toBe(smallBody.length)
  })
})
