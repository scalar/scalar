import { describe, expect, it } from 'vitest'

import { honoRouteFromPath } from './honoRouteFromPath'

describe('honoRouteFromPath', () => {
  it('returns correct route for a simple path', () => {
    expect(honoRouteFromPath('/foobar')).toBe('/foobar')
  })

  it('returns correct route for a path with an ID', () => {
    expect(honoRouteFromPath('/foobar/{id}')).toBe('/foobar/:id')
  })

  it('returns correct route for a path with multiple parameters', () => {
    expect(honoRouteFromPath('/users/{userId}/posts/{postId}')).toBe('/users/:userId/posts/:postId')
  })

  it('returns correct route for a path with a parameter in the middle', () => {
    expect(honoRouteFromPath('/api/{version}/users')).toBe('/api/:version/users')
  })

  it('returns correct route for a path with special characters', () => {
    expect(honoRouteFromPath('/items/{item-id}')).toBe('/items/:item-id')
  })

  it('returns correct route for a path with numbers', () => {
    expect(honoRouteFromPath('/v1/products/{productId}')).toBe('/v1/products/:productId')
  })

  it.skip('handles invalid parameter syntax gracefully', () => {
    expect(() => honoRouteFromPath('/{invalid{}param}')).toThrow()
  })

  it('handles multiple consecutive parameters', () => {
    expect(honoRouteFromPath('/users/{userId}{postId}')).toBe('/users/:userId:postId')
  })

  it('handles parameters with special naming patterns', () => {
    expect(honoRouteFromPath('/api/{api.version}/{user_id}')).toBe('/api/:api.version/:user_id')
  })
})
