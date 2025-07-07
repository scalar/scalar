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

  // Test cases for path parameter matching
  test('should match concrete path to templated path with single parameter', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users/123',
      method: 'GET',
    })

    expect(result).toBe('request-4')
  })

  test('should match concrete path to templated path with multiple parameters', () => {
    const mockRequestsWithMultipleParams = {
      ...mockRequests,
      'request-6': operationSchema.parse({
        uid: 'request-6',
        path: '/users/{id}/orders/{orderId}',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(mockRequestsWithMultipleParams, {
      path: '/users/123/orders/456',
      method: 'GET',
    })

    expect(result).toBe('request-6')
  })

  test('should match concrete path from GitHub issue example', () => {
    const issueExampleRequests = {
      'request-issue': operationSchema.parse({
        uid: 'request-issue',
        path: '/foo/{version}/bar/{contentType}',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(issueExampleRequests, {
      path: '/foo/v3/bar/test',
      method: 'GET',
    })

    expect(result).toBe('request-issue')
  })

  test('should prefer exact match over pattern match', () => {
    const mockRequestsWithExactAndPattern = {
      ...mockRequests,
      'request-exact': operationSchema.parse({
        uid: 'request-exact',
        path: '/users/123',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(mockRequestsWithExactAndPattern, {
      path: '/users/123',
      method: 'GET',
    })

    expect(result).toBe('request-exact')
  })

  test('should handle complex path patterns with mixed segments', () => {
    const complexRequests = {
      'complex-request': operationSchema.parse({
        uid: 'complex-request',
        path: '/api/v1/users/{userId}/posts/{postId}/comments',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(complexRequests, {
      path: '/api/v1/users/789/posts/abc/comments',
      method: 'GET',
    })

    expect(result).toBe('complex-request')
  })

  test('should not match when path segment count differs', () => {
    const result = getRequestUidByPathMethod(mockRequests, {
      path: '/users/123/extra',
      method: 'GET',
    })

    expect(result).toBe('request-1') // Falls back to first request
  })

  test('should handle path parameters with special characters', () => {
    const specialRequests = {
      'special-request': operationSchema.parse({
        uid: 'special-request',
        path: '/files/{fileName}',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(specialRequests, {
      path: '/files/my-file.txt',
      method: 'GET',
    })

    expect(result).toBe('special-request')
  })

  test('should work with the exact GitHub issue example', () => {
    const githubIssueRequests = {
      'github-issue-request': operationSchema.parse({
        uid: 'github-issue-request',
        path: '/foo/{version}/bar/{contentType}',
        method: 'get',
      }),
      'other-request': operationSchema.parse({
        uid: 'other-request',
        path: '/baz',
        method: 'get',
      }),
    }

    const result = getRequestUidByPathMethod(githubIssueRequests, {
      path: '/foo/v3/bar/test',
      method: 'GET',
    })

    expect(result).toBe('github-issue-request')
  })
})
