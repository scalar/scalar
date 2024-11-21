import { afterEach, describe, expect, it, vi } from 'vitest'

import { convertRequestToHarRequest } from './convertRequestToHarRequest'

describe('convertRequestToHarRequest', () => {
  afterEach(() => {
    vi.clearAllMocks()
    vi.restoreAllMocks()
  })

  it('converts a basic GET request', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'get',
    })
    const harRequest = await convertRequestToHarRequest(request)

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

  it('converts a POST request with JSON body', async () => {
    const request = new Request('https://api.example.com/users', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ name: 'John Doe' }),
    })
    const harRequest = await convertRequestToHarRequest(request)

    expect(harRequest).toEqual({
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        {
          name: 'content-type',
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
    const request = new Request('https://api.example.com/users?page=1&limit=10')
    const harRequest = await convertRequestToHarRequest(request)

    expect(harRequest).toEqual({
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
    })
  })

  it('converts a request with headers', async () => {
    const testToken = 'token123'
    const request = new Request('https://api.example.com/users', {
      headers: {
        Authorization: `Bearer ${testToken}`,
        Accept: 'application/json',
      },
    })
    const harRequest = await convertRequestToHarRequest(request)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'accept', value: 'application/json' },
        { name: 'authorization', value: `Bearer ${testToken}` },
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    })
  })

  it('converts a request with cookies', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        Cookie: 'sessionId=abc123; theme=dark',
      },
    })

    const harRequest = await convertRequestToHarRequest(request)

    expect(harRequest).toEqual({
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'cookie', value: 'sessionId=abc123; theme=dark' }],
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
    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('occupation', 'Engineer')

    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      body: formData,
    })

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.text).toEqual(
      '{"name":"John Doe","occupation":"Engineer"}',
    )
  })

  it('converts a request with form-data body with a file', async () => {
    const formData = new FormData()
    const blob = new Blob(['test content'], { type: 'text/plain' })
    formData.append('file', blob, 'test.txt')

    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      body: formData,
    })

    // Vitest cannot seem to handle files in formdata so this is temporarily mocked
    const mockFormData = vi.fn().mockResolvedValue(formData)
    vi.spyOn(Request.prototype, 'formData').mockImplementation(mockFormData)

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.postData?.text).equal(
      '{"file":{"type":"file","text":"BINARY","name":"test.txt","size":12,"mimeType":"text/plain"}}',
    )
    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
  })

  it('converts a request with multiple of the same key in form-data as an array', async () => {
    const formData = new FormData()
    formData.append('name', 'John Doe')
    formData.append('name', 'Jane Doe')
    formData.append('name', 'Jimmy Doe')

    const request = new Request('https://api.example.com/upload', {
      method: 'POST',
      body: formData,
    })

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.postData?.mimeType).toContain('multipart/form-data')
    expect(harRequest.postData?.text).toEqual(
      '{"name":["John Doe","Jane Doe","Jimmy Doe"]}',
    )
  })

  it('converts a request with URL-encoded body', async () => {
    const request = new Request('https://api.example.com/form', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'name=John+Doe&age=30',
    })

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.postData).toEqual({
      mimeType: 'application/x-www-form-urlencoded',
      text: 'name=John+Doe&age=30',
    })
  })

  it('handles requests with multiple cookies', async () => {
    const request = new Request('https://api.example.com/users', {
      headers: {
        Cookie: 'sessionId=abc123; theme=dark; user=john; remember=true',
      },
    })

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.cookies).toHaveLength(4)
    expect(harRequest.cookies).toContainEqual({
      name: 'remember',
      value: 'true',
    })
  })

  it('handles requests with complex query parameters', async () => {
    const request = new Request(
      'https://api.example.com/search?q=test+query&filters[]=one&filters[]=two&sort=desc',
    )

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.queryString).toContainEqual({
      name: 'q',
      value: 'test query',
    })
    expect(harRequest.queryString).toContainEqual({
      name: 'filters[]',
      value: 'one',
    })
    expect(harRequest.queryString).toContainEqual({
      name: 'filters[]',
      value: 'two',
    })
  })

  it('handles requests with non-JSON content types', async () => {
    const request = new Request('https://api.example.com/text', {
      method: 'POST',
      headers: {
        'Content-Type': 'text/plain',
      },
      body: 'Hello, World!',
    })

    const harRequest = await convertRequestToHarRequest(request)
    expect(harRequest.postData).toEqual({
      mimeType: 'text/plain',
      text: 'Hello, World!',
    })
  })
})
