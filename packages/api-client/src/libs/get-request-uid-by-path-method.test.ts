import { describe, test, expect } from 'vitest'
import { getRequestUidByPathMethod } from './get-request-uid-by-path-method'
import { operationSchema, type Operation } from '@scalar/oas-utils/entities/spec'

describe('getRequestUidByPathMethod', () => {
  // Mock requests data with various path patterns
  const mockRequests: Record<string, Operation> = {
    'request-1': operationSchema.parse({
      uid: 'request-1',
      path: '/users',
      method: 'get',
    }),
    'request-2': operationSchema.parse({
      uid: 'request-2',
      path: '/users',
      method: 'post',
    }),
    'request-3': operationSchema.parse({
      uid: 'request-3',
      path: '/products',
      method: 'get',
    }),
    'request-4': operationSchema.parse({
      uid: 'request-4',
      path: '/users/{id}',
      method: 'get',
    }),
    'request-5': operationSchema.parse({
      uid: 'request-5',
      path: '/orders',
      method: 'put',
    }),
  }

  // Empty requests object for edge case testing
  const emptyRequests: Record<string, Operation> = {}

  test('returns requestUid when provided in payload', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      requestUid: 'request-2',
      path: '/users',
      method: 'GET',
    })

    expect(result).toBe('request-2')
  })

  test('returns requestUid even when it does not exist in requests', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      requestUid: 'non-existent-request',
      path: '/users',
      method: 'GET',
    })

    expect(result).toBe('non-existent-request')
  })

  test('finds request by exact path and method match', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/products',
      method: 'GET',
    })

    expect(result).toBe('request-3')
  })

  test('finds request by path and method (case-insensitive for method)', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users',
      method: 'get',
    })

    expect(result).toBe('request-1')
  })

  test('finds request by path and method (case-insensitive for path)', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/Users',
      method: 'GET',
    })

    expect(result).toBe('request-1')
  })

  test('finds request by path and method (case-insensitive for both)', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/Users',
      method: 'get',
    })

    expect(result).toBe('request-1')
  })

  test('returns first request uid when no match found', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/nonexistent',
      method: 'GET',
    })

    expect(result).toBe('request-1')
  })

  test('returns first request uid when payload is undefined', () => {
    const result = getRequestUidByPathMethod(mockRequests)

    expect(result).toBe('request-1')
  })

  test('returns first request uid when empty payload is provided', () => {
    const result = getRequestUidByPathMethod(mockRequests, {})

    expect(result).toBe('request-1')
  })

  test('handles partial payload with only method', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      method: 'POST',
    })

    expect(result).toBe('request-1')
  })

  test('handles partial payload with only path', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/products',
    })

    expect(result).toBe('request-1')
  })

  test('handles empty requests object', () => {
    const result = getRequestUidByPathMethod(emptyRequests, {
      path: '/users',
      method: 'GET',
    })

    expect(result).toBe(undefined)
  })

  test('handles null method in payload', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users',
      method: null as any,
    })

    expect(result).toBe('request-1')
  })

  test('handles null path in payload', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: null as any,
      method: 'GET',
    })

    expect(result).toBe('request-1')
  })

  test('handles path with trailing slash', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users/',
      method: 'GET',
    })

    expect(result).toBe('request-1')
  })

  test('handles path with query parameters', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users?sort=asc',
      method: 'GET',
    })

    expect(result).toBe('request-1')
  })
})
