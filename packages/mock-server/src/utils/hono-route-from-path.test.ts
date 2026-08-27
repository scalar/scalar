import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { honoRouteFromPath } from './hono-route-from-path'

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

  it('drops the query string of a path key', () => {
    expect(honoRouteFromPath('/v1/messages?beta=true')).toBe('/v1/messages')
  })

  it('drops the query string but keeps the path parameters', () => {
    expect(honoRouteFromPath('/v1/models/{model_id}?beta=true')).toBe('/v1/models/:model_id')
  })

  it('leaves characters Hono treats as literal text alone', () => {
    expect(honoRouteFromPath('/reports/{id}/summary+full')).toBe('/reports/:id/summary+full')
  })

  describe('escaping', () => {
    it('matches a colon in a path key literally instead of as a parameter', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/users:batchGet'), (c) => c.text('matched'))

      expect((await app.request('/users:batchGet')).status).toBe(200)
      expect((await app.request('/usersBatchGet')).status).toBe(404)
    })

    it('matches an asterisk in a path key literally instead of as a wildcard', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports*'), (c) => c.text('matched'))

      expect((await app.request('/reports*')).status).toBe(200)
      expect((await app.request('/reports/2024')).status).toBe(404)
    })

    it('matches a plus in a path key literally instead of as a quantifier', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/tags/summary+full'), (c) => c.text('matched'))

      expect((await app.request('/tags/summary+full')).status).toBe(200)
      expect((await app.request('/tags/summaryyy')).status).toBe(404)
    })

    it('matches a pipe in a path key literally instead of as an alternation', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports/{id}/a|b'), (c) => c.text('matched'))

      expect((await app.request('/reports/1/a|b')).status).toBe(200)
      expect((await app.request('/reports/1/a')).status).toBe(404)
    })

    it('keeps a path parameter next to escaped literal text wildcard-free', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports/{id}:cancel'), (c) => c.text('matched'))

      expect((await app.request('/reports/1:cancel')).status).toBe(200)
      expect((await app.request('/reports/1/2:cancel')).status).toBe(404)
    })

    it('routes a path key with a question mark without breaking its sibling', async () => {
      // Two routes that used to make Hono's `RegExpRouter` compile an invalid regular expression and
      // throw on the very first request.
      const app = new Hono()
      app.get(honoRouteFromPath('/a/{x}/b?q=1'), (c) => c.text('b'))
      app.get(honoRouteFromPath('/a/{x}/b/{y}?q=1'), (c) => c.text('by'))

      expect((await app.request('/a/1/b')).status).toBe(200)
      expect((await app.request('/a/1/b/2')).status).toBe(200)
    })

    it('does not touch a path key Hono can route as written', () => {
      expect(honoRouteFromPath('/users/{id}/posts')).toBe('/users/:id/posts')
    })
  })
})
