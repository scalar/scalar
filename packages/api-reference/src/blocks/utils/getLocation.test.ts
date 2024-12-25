import { describe, expect, it } from 'vitest'

import { getLocation } from './getLocation'

describe('getLocation', () => {
  it('should return the correct location', () => {
    expect(getLocation('GET', '/planets/{planetId}')).toBe(
      '#/paths/~1planets~1{planetId}/get',
    )
  })

  it('should handle empty paths', () => {
    expect(() => getLocation('GET', '')).toThrow()
  })

  it('should handle paths with special characters', () => {
    expect(getLocation('POST', '/users/~/settings')).toBe(
      '#/paths/~1users~1~0~1settings/post',
    )
  })

  it('converts method to lowercase', () => {
    expect(getLocation('POST', '/users')).toBe('#/paths/~1users/post')
    expect(getLocation('get', '/users')).toBe('#/paths/~1users/get')
    expect(getLocation('DELETE', '/users')).toBe('#/paths/~1users/delete')
  })

  it('handles multiple path parameters', () => {
    expect(getLocation('GET', '/users/{userId}/posts/{postId}')).toBe(
      '#/paths/~1users~1{userId}~1posts~1{postId}/get',
    )
  })

  it('escapes forward slashes', () => {
    expect(getLocation('GET', '/path/with/many/slashes')).toBe(
      '#/paths/~1path~1with~1many~1slashes/get',
    )
  })
})
