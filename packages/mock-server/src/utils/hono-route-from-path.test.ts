import { describe, expect, it } from 'vitest'

import { honoRouteFromPath, parsePathKey } from './hono-route-from-path'

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

  it('drops the query string from a path key', () => {
    expect(honoRouteFromPath('/v1/messages?beta=true')).toBe('/v1/messages')
  })

  describe('parsePathKey', () => {
    it('returns no query parameters for a plain path key', () => {
      expect(parsePathKey('/v1/messages')).toEqual({ route: '/v1/messages', query: [] })
    })

    it('splits a path key into a route and its query parameters', () => {
      expect(parsePathKey('/v1/messages?beta=true')).toEqual({
        route: '/v1/messages',
        query: [{ name: 'beta', value: 'true' }],
      })
    })

    it('returns every query parameter', () => {
      expect(parsePathKey('/v1/messages/{id}?beta=true&version=2')).toEqual({
        route: '/v1/messages/:id',
        query: [
          { name: 'beta', value: 'true' },
          { name: 'version', value: '2' },
        ],
      })
    })

    it('keeps a repeated query parameter as two entries', () => {
      expect(parsePathKey('/v1/messages?tag=a&tag=b')).toEqual({
        route: '/v1/messages',
        query: [
          { name: 'tag', value: 'a' },
          { name: 'tag', value: 'b' },
        ],
      })
    })

    it('reads a query parameter without a value as an empty value', () => {
      expect(parsePathKey('/v1/messages?beta')).toEqual({
        route: '/v1/messages',
        query: [{ name: 'beta', value: '' }],
      })
    })

    it('drops a query parameter without a name', () => {
      expect(parsePathKey('/v1/messages?=1')).toEqual({ route: '/v1/messages', query: [] })
    })

    it('decodes percent-encoded query parameters', () => {
      expect(parsePathKey('/v1/messages?filter=a%20b')).toEqual({
        route: '/v1/messages',
        query: [{ name: 'filter', value: 'a b' }],
      })
    })

    it('ignores an empty query string', () => {
      expect(parsePathKey('/v1/messages?')).toEqual({ route: '/v1/messages', query: [] })
    })

    it('splits at the first question mark only', () => {
      expect(parsePathKey('/v1/messages?filter=a?b')).toEqual({
        route: '/v1/messages',
        query: [{ name: 'filter', value: 'a?b' }],
      })
    })
  })
})
