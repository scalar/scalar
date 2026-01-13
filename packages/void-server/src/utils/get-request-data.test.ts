import type { Context } from 'hono'
import { describe, expect, it, vi } from 'vitest'

import { createMockContext } from '../../test/utils/create-mock-context'
import { getRequestData } from './get-request-data'

/** Mock getCookie from hono/cookie */
vi.mock('hono/cookie', () => ({
  getCookie: vi.fn(() => ({})),
}))

type RequestDataResult = Awaited<ReturnType<typeof getRequestData>> & {
  authentication?: {
    type: string
    token: string
    value?: string
  }
}

describe('get-request-data', () => {
  it('returns method and path from the request', async () => {
    const mockContext = createMockContext({
      method: 'POST',
      path: '/api/users',
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect(result.method).toBe('POST')
    expect(result.path).toBe('/api/users')
  })

  it('returns request headers', async () => {
    const mockContext = createMockContext({
      requestHeaders: {
        'Content-Type': 'application/json',
        'X-Custom-Header': 'custom-value',
      },
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect(result.headers['content-type']).toBe('application/json')
    expect(result.headers['x-custom-header']).toBe('custom-value')
  })

  it('parses Basic authentication from Authorization header', async () => {
    // "user:password" encoded in base64 is "dXNlcjpwYXNzd29yZA=="
    const mockContext = createMockContext({
      requestHeaders: {
        Authorization: 'Basic dXNlcjpwYXNzd29yZA==',
      },
    })

    const result = (await getRequestData(mockContext as unknown as Context)) as RequestDataResult

    expect(result.authentication).toEqual({
      type: 'http.basic',
      token: 'dXNlcjpwYXNzd29yZA==',
      value: 'user:password',
    })
  })

  it('parses Bearer authentication from Authorization header', async () => {
    const mockContext = createMockContext({
      requestHeaders: {
        Authorization: 'Bearer my-jwt-token',
      },
    })

    const result = (await getRequestData(mockContext as unknown as Context)) as RequestDataResult

    expect(result.authentication).toEqual({
      type: 'http.bearer',
      token: 'my-jwt-token',
    })
  })

  it('returns query parameters with single values', async () => {
    const mockContext = createMockContext({
      query: {
        page: ['1'],
        limit: ['10'],
      },
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect(result.query.page).toBe('1')
    expect(result.query.limit).toBe('10')
  })

  it('returns query parameters with multiple values as arrays', async () => {
    const mockContext = createMockContext({
      query: {
        tags: ['javascript', 'typescript', 'vue'],
      },
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect(result.query.tags).toEqual(['javascript', 'typescript', 'vue'])
  })

  it('parses JSON body from the request', async () => {
    const mockContext = createMockContext({
      requestHeaders: { 'Content-Type': 'application/json' },
      requestBody: '{"name": "John"}',
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect(result.body).toEqual({ name: 'John' })
  })

  it('does not include authentication when no Authorization header is present', async () => {
    const mockContext = createMockContext({
      requestHeaders: {},
    })

    const result = await getRequestData(mockContext as unknown as Context)

    expect('authentication' in result).toBe(false)
  })
})
