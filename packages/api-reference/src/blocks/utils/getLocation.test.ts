import { describe, expect, it } from 'vitest'

import { getLocation } from './getLocation'

describe('getLocation', () => {
  it('should return the correct location', () => {
    expect(getLocation('GET', '/planets/{planetId}')).toBe(
      '#/paths/get/~1planets~1{planetId}',
    )
  })

  it('should handle empty paths', () => {
    expect(() => getLocation('GET', '')).toThrow()
  })

  it('should handle paths with special characters', () => {
    expect(getLocation('POST', '/users/~/settings')).toBe(
      '#/paths/post/~1users~1~0~1settings',
    )
  })

  it('converts method to lowercase', () => {
    expect(getLocation('POST', '/users')).toBe('#/paths/post/~1users')
    expect(getLocation('get', '/users')).toBe('#/paths/get/~1users')
    expect(getLocation('DELETE', '/users')).toBe('#/paths/delete/~1users')
  })

  it('handles multiple path parameters', () => {
    expect(getLocation('GET', '/users/{userId}/posts/{postId}')).toBe(
      '#/paths/get/~1users~1{userId}~1posts~1{postId}',
    )
  })

  it('escapes forward slashes', () => {
    expect(getLocation('GET', '/path/with/many/slashes')).toBe(
      '#/paths/get/~1path~1with~1many~1slashes',
    )
  })
})
