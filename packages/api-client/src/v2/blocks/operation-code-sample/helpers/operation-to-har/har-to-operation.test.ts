import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import type { Request as HarRequest } from 'har-format'
import { describe, expect, it } from 'vitest'

import { harToOperation } from './har-to-operation'

describe('harToOperation', () => {
  it('converts query parameters from HAR to operation examples', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.parameters).toHaveLength(2)

    const pageParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'page'
    })
    const limitParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'limit'
    })

    const resolvedPageParam = getResolvedRef(pageParam)
    if (resolvedPageParam && 'examples' in resolvedPageParam) {
      expect(resolvedPageParam.in).toBe('query')
      expect(getResolvedRef(resolvedPageParam.examples?.default)?.value).toBe('1')
    } else {
      throw new Error('Page parameter not found or malformed')
    }

    const resolvedLimitParam = getResolvedRef(limitParam)
    if (resolvedLimitParam && 'examples' in resolvedLimitParam) {
      expect(resolvedLimitParam.in).toBe('query')
      expect(getResolvedRef(resolvedLimitParam.examples?.default)?.value).toBe('10')
    } else {
      throw new Error('Limit parameter not found or malformed')
    }
  })

  it('converts headers from HAR to operation examples', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'X-API-Key', value: 'abc123' },
        { name: 'Content-Type', value: 'application/json' }, // Should be excluded
      ],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'example1',
    })

    // Content-Type should be excluded, so only 2 parameters
    expect(result.parameters).toHaveLength(2)

    const authParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'Authorization'
    })

    const resolvedAuthParam = getResolvedRef(authParam)
    if (resolvedAuthParam && 'examples' in resolvedAuthParam) {
      expect(resolvedAuthParam.in).toBe('header')
      expect(getResolvedRef(resolvedAuthParam.examples?.example1)?.value).toBe('Bearer token123')
    } else {
      throw new Error('Authorization parameter not found or malformed')
    }
  })

  it('converts cookies from HAR to operation examples', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [
        { name: 'session_id', value: 'sess_abc123' },
        { name: 'theme', value: 'dark' },
      ],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.parameters).toHaveLength(2)

    const sessionParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'session_id'
    })

    const resolvedSessionParam = getResolvedRef(sessionParam)
    if (resolvedSessionParam && 'examples' in resolvedSessionParam) {
      expect(resolvedSessionParam.in).toBe('cookie')
      expect(getResolvedRef(resolvedSessionParam.examples?.default)?.value).toBe('sess_abc123')
    } else {
      throw new Error('Session parameter not found or malformed')
    }
  })

  it('converts JSON request body from HAR to operation examples', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.requestBody).toBeDefined()

    if (result.requestBody && 'content' in result.requestBody) {
      const jsonContent = result.requestBody.content?.['application/json']
      expect(jsonContent).toBeDefined()
      expect(getResolvedRef(jsonContent?.examples?.default)?.value).toEqual({
        name: 'John Doe',
        email: 'john@example.com',
      })
    } else {
      throw new Error('Request body not found or malformed')
    }
  })

  it('converts form data from HAR to operation examples', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/login',
      httpVersion: 'HTTP/1.1',
      headers: [{ name: 'Content-Type', value: 'application/x-www-form-urlencoded' }],
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.requestBody).toBeDefined()

    if (result.requestBody && 'content' in result.requestBody) {
      const formContent = result.requestBody.content?.['application/x-www-form-urlencoded']
      expect(formContent).toBeDefined()
      expect(getResolvedRef(formContent?.examples?.default)?.value).toEqual({
        username: 'johndoe',
        password: 'secret123',
      })
    } else {
      throw new Error('Request body not found or malformed')
    }
  })

  it('merges with base operation without overwriting existing parameters', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer' },
          examples: {
            existing: { value: 5 },
          },
        },
      ],
    }

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

    const result = harToOperation({
      harRequest,
      exampleKey: 'newExample',
      baseOperation,
    })

    // Should have 2 parameters: existing page + new limit
    expect(result.parameters).toHaveLength(2)

    const pageParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'page'
    })

    const resolvedPageParam = getResolvedRef(pageParam)
    if (resolvedPageParam && 'examples' in resolvedPageParam) {
      // Should have both existing and new example
      expect(getResolvedRef(resolvedPageParam.examples?.existing)?.value).toBe(5)
      expect(getResolvedRef(resolvedPageParam.examples?.newExample)?.value).toBe('1')
    } else {
      throw new Error('Page parameter not found or malformed')
    }
  })

  it('handles invalid JSON gracefully by keeping it as text', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: 'invalid{json}',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    if (result.requestBody && 'content' in result.requestBody) {
      const jsonContent = result.requestBody.content?.['application/json']
      expect(getResolvedRef(jsonContent?.examples?.default)?.value).toBe('invalid{json}')
    } else {
      throw new Error('Request body not found or malformed')
    }
  })
})
