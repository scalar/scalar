import type { HarRequest } from '@scalar/snippetz'
import { getResolvedRef } from '@scalar/workspace-store/helpers/get-resolved-ref'
import type { OperationObject } from '@scalar/workspace-store/schemas/v3.1/strict/openapi-document'
import { assert, describe, expect, it } from 'vitest'

import { harToOperation } from './har-to-operation'

describe('harToOperation', () => {
  it('converts basic GET request to operation', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result).toBeDefined()
    expect(result.parameters).toEqual([])
  })

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
    assert(resolvedPageParam && 'examples' in resolvedPageParam)
    expect(resolvedPageParam.in).toBe('query')
    expect(getResolvedRef(resolvedPageParam.examples?.default)?.value).toBe('1')
    expect(getResolvedRef(resolvedPageParam.examples?.default)?.['x-disabled']).toBe(false)

    const resolvedLimitParam = getResolvedRef(limitParam)
    assert(resolvedLimitParam && 'examples' in resolvedLimitParam)
    expect(resolvedLimitParam.in).toBe('query')
    expect(getResolvedRef(resolvedLimitParam.examples?.default)?.value).toBe('10')
    expect(getResolvedRef(resolvedLimitParam.examples?.default)?.['x-disabled']).toBe(false)
  })

  it('converts headers from HAR to operation examples', () => {
    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'X-API-Key', value: 'abc123' },
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

    expect(result.parameters).toHaveLength(2)

    const authParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'Authorization'
    })

    const resolvedAuthParam = getResolvedRef(authParam)
    assert(resolvedAuthParam && 'examples' in resolvedAuthParam)
    expect(resolvedAuthParam.in).toBe('header')
    expect(getResolvedRef(resolvedAuthParam.examples?.example1)?.value).toBe('Bearer token123')
    expect(getResolvedRef(resolvedAuthParam.examples?.example1)?.['x-disabled']).toBe(false)
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
    assert(resolvedSessionParam && 'examples' in resolvedSessionParam)
    expect(resolvedSessionParam.in).toBe('cookie')
    expect(getResolvedRef(resolvedSessionParam.examples?.default)?.value).toBe('sess_abc123')
    expect(getResolvedRef(resolvedSessionParam.examples?.default)?.['x-disabled']).toBe(false)
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

    assert(result.requestBody && 'content' in result.requestBody)
    const jsonContent = result.requestBody.content?.['application/json']
    assert(jsonContent)
    expect(getResolvedRef(jsonContent.examples?.default)?.value).toBe(
      JSON.stringify({ name: 'John Doe', email: 'john@example.com' }),
    )
    expect(getResolvedRef(jsonContent.examples?.default)?.['x-disabled']).toBe(false)
  })

  it('converts form data from HAR to operation examples as array', () => {
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

    assert(result.requestBody && 'content' in result.requestBody)
    const formContent = result.requestBody.content?.['application/x-www-form-urlencoded']
    assert(formContent)

    const exampleValue = getResolvedRef(formContent.examples?.default)?.value
    expect(Array.isArray(exampleValue)).toBe(true)
    expect(exampleValue).toEqual([
      { name: 'username', value: 'johndoe', 'x-disabled': false },
      { name: 'password', value: 'secret123', 'x-disabled': false },
    ])
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
    assert(resolvedPageParam && 'examples' in resolvedPageParam)
    // Should have both existing and new example
    expect(getResolvedRef(resolvedPageParam.examples?.existing)?.value).toBe(5)
    expect(getResolvedRef(resolvedPageParam.examples?.newExample)?.value).toBe('1')
  })

  it('sets x-scalar-selected-content-type when adding request body', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: '{"test": "data"}',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'example1',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    expect(result.requestBody['x-scalar-selected-content-type']).toBeDefined()
    expect(result.requestBody['x-scalar-selected-content-type']?.example1).toBe('application/json')
  })

  it('handles empty query string array', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.parameters).toEqual([])
  })

  it('handles empty headers array', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.parameters).toEqual([])
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.parameters).toEqual([])
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    expect(result.requestBody).toBeUndefined()
  })

  it('creates request body if base operation does not have one', () => {
    const baseOperation: OperationObject = {}

    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: '{"test": "data"}',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
    })

    assert(result.requestBody && 'content' in result.requestBody)
    expect(result.requestBody.content?.['application/json']).toBeDefined()
  })

  it('adds new content type to existing request body', () => {
    const baseOperation: OperationObject = {
      requestBody: {
        content: {
          'application/xml': {
            schema: { type: 'object' },
          },
        },
      },
    }

    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/json',
        text: '{"test": "data"}',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
    })

    assert(result.requestBody && 'content' in result.requestBody)
    expect(result.requestBody.content?.['application/xml']).toBeDefined()
    expect(result.requestBody.content?.['application/json']).toBeDefined()
  })

  it('handles path variables in base operation', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
      pathVariables: { userId: '123' },
    })

    const userIdParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'userId'
    })

    const resolvedUserIdParam = getResolvedRef(userIdParam)
    assert(resolvedUserIdParam && 'examples' in resolvedUserIdParam)
    expect(resolvedUserIdParam.in).toBe('path')
    expect(getResolvedRef(resolvedUserIdParam.examples?.default)?.value).toBe('123')
    expect(getResolvedRef(resolvedUserIdParam.examples?.default)?.['x-disabled']).toBe(false)
  })

  it('handles multiple path variables', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
        {
          name: 'postId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users/123/posts/456',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
      pathVariables: { userId: '123', postId: '456' },
    })

    expect(result.parameters).toHaveLength(2)

    const userIdParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'userId'
    })
    const postIdParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'postId'
    })

    const resolvedUserId = getResolvedRef(userIdParam)
    assert(resolvedUserId && 'schema' in resolvedUserId && resolvedUserId.examples)
    expect(getResolvedRef(resolvedUserId.examples.default)?.value).toBe('123')

    const resolvedPostId = getResolvedRef(postIdParam)
    assert(resolvedPostId && 'schema' in resolvedPostId && resolvedPostId.examples)
    expect(getResolvedRef(resolvedPostId.examples.default)?.value).toBe('456')
  })

  it('handles empty path variables object', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'userId',
          in: 'path',
          required: true,
          schema: { type: 'string' },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users/123',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
      pathVariables: {},
    })

    const userIdParam = result.parameters?.find((p) => {
      const resolved = getResolvedRef(p)
      return resolved?.name === 'userId'
    })

    const resolvedUserId = getResolvedRef(userIdParam)
    assert(resolvedUserId && 'schema' in resolvedUserId && resolvedUserId.examples)
    // Should have empty value when path variable is not provided
    expect(getResolvedRef(resolvedUserId.examples.default)?.value).toBe('')
  })

  it('handles XML request body', () => {
    const xmlBody = '<?xml version="1.0"?><user><name>John</name></user>'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'application/xml',
        text: xmlBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    const xmlContent = result.requestBody.content?.['application/xml']
    assert(xmlContent)
    expect(getResolvedRef(xmlContent.examples?.default)?.value).toBe(xmlBody)
  })

  it('handles plain text request body', () => {
    const textBody = 'Plain text data'
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/notes',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [],
      cookies: [],
      postData: {
        mimeType: 'text/plain',
        text: textBody,
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    const textContent = result.requestBody.content?.['text/plain']
    assert(textContent)
    expect(getResolvedRef(textContent.examples?.default)?.value).toBe(textBody)
  })

  it('handles multipart form data with files', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    const formContent = result.requestBody.content?.['multipart/form-data']
    assert(formContent)

    const exampleValue = getResolvedRef(formContent.examples?.default)?.value
    expect(Array.isArray(exampleValue)).toBe(true)
    expect(exampleValue).toEqual([
      { name: 'username', value: 'johndoe', 'x-disabled': false },
      { name: 'file', value: '@avatar.png', 'x-disabled': false },
    ])
  })

  it('handles complex combination of parameters', () => {
    const harRequest: HarRequest = {
      method: 'POST',
      url: 'https://api.example.com/users?filter=active&sort=name',
      httpVersion: 'HTTP/1.1',
      headers: [
        { name: 'Authorization', value: 'Bearer token123' },
        { name: 'X-Custom-Header', value: 'custom-value' },
      ],
      queryString: [
        { name: 'filter', value: 'active' },
        { name: 'sort', value: 'name' },
      ],
      cookies: [
        { name: 'session', value: 'abc123' },
        { name: 'tracking', value: 'xyz789' },
      ],
      postData: {
        mimeType: 'application/json',
        text: '{"name": "John"}',
      },
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    // Should have 2 query + 2 headers + 2 cookies = 6 parameters
    expect(result.parameters).toHaveLength(6)

    // Verify request body
    assert(result.requestBody && 'content' in result.requestBody)
    expect(result.requestBody.content?.['application/json']).toBeDefined()
  })

  it('does not duplicate parameters on subsequent calls with different examples', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer' },
          examples: {
            example1: { value: 1 },
          },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?page=2',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [{ name: 'page', value: '2' }],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'example2',
      baseOperation,
    })

    // Should still have only 1 parameter, not duplicated
    expect(result.parameters).toHaveLength(1)

    const pageParam = getResolvedRef(result.parameters?.[0])
    assert(pageParam && 'schema' in pageParam && pageParam.examples)
    // Should have both examples
    expect(pageParam.examples.example1).toBeDefined()
    expect(pageParam.examples.example2).toBeDefined()
    expect(getResolvedRef(pageParam.examples.example2)?.value).toBe('2')
  })

  it('handles empty postData text', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    const jsonContent = result.requestBody.content?.['application/json']
    assert(jsonContent)
    expect(getResolvedRef(jsonContent.examples?.default)?.value).toBe('')
  })

  it('handles empty postData params array', () => {
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

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
    })

    assert(result.requestBody && 'content' in result.requestBody)
    const formContent = result.requestBody.content?.['application/x-www-form-urlencoded']
    assert(formContent)
    const exampleValue = getResolvedRef(formContent.examples?.default)?.value
    // When params array is empty, it falls back to text field (which is undefined if not provided)
    expect(exampleValue).toBeUndefined()
  })

  it('preserves parameter schema from base operation', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'limit',
          in: 'query',
          schema: {
            type: 'integer',
            minimum: 1,
            maximum: 100,
          },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users?limit=50',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [{ name: 'limit', value: '50' }],
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
    })

    const limitParam = getResolvedRef(result.parameters?.[0])
    assert(limitParam && 'schema' in limitParam && limitParam.schema)
    const schema = getResolvedRef(limitParam.schema)
    assert(schema && 'type' in schema)
    expect(schema.type).toBe('integer')
    assert('minimum' in schema)
    expect(schema.minimum).toBe(1)
    assert('maximum' in schema)
    expect(schema.maximum).toBe(100)
  })

  it('sets parameters from base operation as disabled when no matching HAR data', () => {
    const baseOperation: OperationObject = {
      parameters: [
        {
          name: 'page',
          in: 'query',
          schema: { type: 'integer' },
          examples: {
            default: { value: 1 },
          },
        },
      ],
    }

    const harRequest: HarRequest = {
      method: 'GET',
      url: 'https://api.example.com/users',
      httpVersion: 'HTTP/1.1',
      headers: [],
      queryString: [], // No query parameters in HAR
      cookies: [],
      headersSize: -1,
      bodySize: -1,
    }

    const result = harToOperation({
      harRequest,
      exampleKey: 'default',
      baseOperation,
    })

    const pageParam = getResolvedRef(result.parameters?.[0])
    assert(pageParam && 'schema' in pageParam && pageParam.examples)
    // The existing example should be marked as disabled
    expect(getResolvedRef(pageParam.examples.default)?.['x-disabled']).toBe(true)
  })
})
