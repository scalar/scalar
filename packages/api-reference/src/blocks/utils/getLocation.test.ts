import { describe, expect, it } from 'vitest'

import { getLocation } from './getLocation'

describe('getLocation', () => {
  it('should return the correct location', () => {
    expect(getLocation(['paths', '/planets/{planetId}', 'get'])).toBe(
      '#/paths/~1planets~1{planetId}/get',
    )
  })

  it('should handle empty paths', () => {
    expect(() => getLocation(['paths', '', 'get'])).toThrow()
  })

  it('should handle paths with special characters', () => {
    expect(getLocation(['paths', '/users/~/settings', 'post'])).toBe(
      '#/paths/~1users~1~0~1settings/post',
    )
  })

  it('converts method to lowercase', () => {
    expect(getLocation(['paths', '/users', 'post'])).toBe(
      '#/paths/~1users/post',
    )
    expect(getLocation(['paths', '/users', 'get'])).toBe('#/paths/~1users/get')
    expect(getLocation(['paths', '/users', 'delete'])).toBe(
      '#/paths/~1users/delete',
    )
  })

  it('handles multiple path parameters', () => {
    expect(
      getLocation(['paths', '/users/{userId}/posts/{postId}', 'get']),
    ).toBe('#/paths/~1users~1{userId}~1posts~1{postId}/get')
  })

  it('escapes forward slashes', () => {
    expect(getLocation(['paths', '/path/with/many/slashes', 'get'])).toBe(
      '#/paths/~1path~1with~1many~1slashes/get',
    )
  })
})
