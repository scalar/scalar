import { describe, expect, it } from 'vitest'

import { getPointer } from './getPointer'

describe('getPointer', () => {
  it('should return the correct location', () => {
    expect(getPointer(['paths', '/planets/{planetId}', 'get'])).toBe('#/paths/~1planets~1{planetId}/get')
  })

  it('should handle empty paths', () => {
    // @ts-expect-error testing invalid input
    expect(() => getPointer([''])).toThrow()
  })

  it('should handle paths with special characters', () => {
    expect(getPointer(['paths', '/users/~/settings', 'post'])).toBe('#/paths/~1users~1~0~1settings/post')
  })

  it('converts method to lowercase', () => {
    expect(getPointer(['paths', '/users', 'post'])).toBe('#/paths/~1users/post')
    expect(getPointer(['paths', '/users', 'get'])).toBe('#/paths/~1users/get')
    expect(getPointer(['paths', '/users', 'delete'])).toBe('#/paths/~1users/delete')
  })

  it('handles multiple path parameters', () => {
    expect(getPointer(['paths', '/users/{userId}/posts/{postId}', 'get'])).toBe(
      '#/paths/~1users~1{userId}~1posts~1{postId}/get',
    )
  })

  it('escapes forward slashes', () => {
    expect(getPointer(['paths', '/path/with/many/slashes', 'get'])).toBe('#/paths/~1path~1with~1many~1slashes/get')
  })

  it('allows certain paths to be returned as strings', () => {
    expect(getPointer(['components', 'schemas', 'Planet'])).toBe('#/components/schemas/Planet')

    expect(getPointer(['paths', '/planets/{planetId}', 'get'])).toBe('#/paths/~1planets~1{planetId}/get')

    /** @ts-expect-error testing invalid input */
    expect(getPointer(['fantasy'])).toBe('#/fantasy')
  })
})
