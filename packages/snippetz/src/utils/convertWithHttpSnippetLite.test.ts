import type { HarRequest } from '@scalar/types/snippetz'
import { describe, expect, it } from 'vitest'

import { convertWithHttpSnippetLite } from './convertWithHttpSnippetLite'

describe('convertWithHttpSnippetLite', () => {
  it('converts a basic GET request', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/users',
      method: 'GET',
    })

    const parsed = JSON.parse(result)
    expect(parsed.method).toBe('GET')
    expect(parsed.url).toBe('https://api.example.com/users')
    expect(parsed.headers).toEqual([])
  })

  it('handles query parameters', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/search?q=test&page=1',
      method: 'GET',
    })

    const parsed = JSON.parse(result)
    expect(parsed.queryObj).toEqual({
      q: 'test',
      page: '1',
    })
    expect(parsed.queryString).toEqual([
      { name: 'q', value: 'test' },
      { name: 'page', value: '1' },
    ])
  })

  it('preserves duplicate query parameters as arrays in queryObj', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/search?statuses=active&statuses=inactive',
      method: 'GET',
    })

    const parsed = JSON.parse(result)
    expect(parsed.queryObj).toEqual({
      statuses: ['active', 'inactive'],
    })
    expect(parsed.queryString).toEqual([
      { name: 'statuses', value: 'active' },
      { name: 'statuses', value: 'inactive' },
    ])
  })

  it('processes headers correctly', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/data',
      method: 'GET',
      headers: [
        { name: 'Content-Type', value: 'application/json' },
        { name: 'Authorization', value: 'Bearer token' },
      ],
    })

    const parsed = JSON.parse(result)
    expect(parsed.headersObj).toEqual({
      'Content-Type': 'application/json',
      'Authorization': 'Bearer token',
    })
  })

  it('handles POST requests with JSON body', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/users',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ name: 'John', age: 30 }),
      },
    })

    const parsed = JSON.parse(result)
    expect(parsed.method).toBe('POST')
    expect(parsed.postData.jsonObj).toEqual({
      name: 'John',
      age: 30,
    })
  })

  it('handles invalid JSON body gracefully', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/users',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: 'invalid json',
      },
    })

    const parsed = JSON.parse(result)
    expect(parsed.postData.jsonObj).toBeUndefined()
  })

  it('returns empty string if client.convert is not a function', () => {
    const mockClient = {}

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/users',
      method: 'GET',
    })

    expect(result).toBe('')
  })

  it('handles URLs with trailing slash correctly', () => {
    const mockClient = {
      convert: (request: HarRequest) => JSON.stringify(request, null, 2),
    }

    const result = convertWithHttpSnippetLite(mockClient, {
      url: 'https://api.example.com/',
    })

    const parsed = JSON.parse(result)
    expect(parsed.url).toBe('https://api.example.com')
  })
})
