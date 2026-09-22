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
      // The sibling route keeps Hono from serving the key as a static path, which is what used to
      // hide the colon being read as a parameter.
      const app = new Hono()
      app.get(honoRouteFromPath('/{id}/users:batchGet'), (c) => c.text('matched'))
      app.get(honoRouteFromPath('/{id}/users'), (c) => c.text('sibling'))

      expect((await app.request('/1/users:batchGet')).status).toBe(200)
      expect((await app.request('/1/usersBatchGet')).status).toBe(404)
    })

    it('escapes the segments behind an escaped one', async () => {
      // Hono splices the segment behind a pattern into a lookahead without escaping it, so an
      // unbalanced bracket further down the path used to break every request the router handled.
      const app = new Hono()
      app.get(honoRouteFromPath('/users:batchGet/x)'), (c) => c.text('matched'))
      app.get(honoRouteFromPath('/users/{id}'), (c) => c.text('sibling'))

      expect(await (await app.request('/users:batchGet/x)')).text()).toBe('matched')
      expect(await (await app.request('/users/1')).text()).toBe('sibling')
      expect((await app.request('/anything')).status).toBe(404)
    })

    it('matches a request against an escaped segment without backtracking', async () => {
      // An OpenAPI document is untrusted input: a pattern built from several greedy groups would
      // backtrack exponentially on a crafted request and block the event loop.
      const app = new Hono()
      app.get(honoRouteFromPath('/{a}:{b}:{c}:{d}:{e}:{f}:{g}:{h}:END'), (c) => c.text('matched'))

      const start = performance.now()

      expect((await app.request(`/${Array.from({ length: 60 }, () => 'aa').join(':')}:NOPE`)).status).toBe(404)
      expect(performance.now() - start).toBeLessThan(1_000)
    })

    it('routes a path key that ends in a slash behind an escaped segment', async () => {
      // An empty segment has no literal text to turn into a pattern. Escaping it anyway produced an
      // empty pattern, which Hono cannot parse — it then threw for every route on the server.
      const app = new Hono()
      app.get(honoRouteFromPath('/api/users:search/'), (c) => c.text('matched'))
      app.get(honoRouteFromPath('/healthz'), (c) => c.text('healthy'))

      expect(await (await app.request('/api/users:search/')).text()).toBe('matched')
      expect(await (await app.request('/healthz')).text()).toBe('healthy')
    })

    it('accepts a parameter value that contains the delimiter behind it', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/v1/{name}:cancel'), (c) => c.text('matched'))

      expect((await app.request('/v1/a:b:cancel')).status).toBe(200)
      expect((await app.request('/v1/a:b')).status).toBe(404)
    })

    it('matches an asterisk in a path key literally instead of as a wildcard', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports*'), (c) => c.text('matched'))

      expect((await app.request('/reports*')).status).toBe(200)
      expect((await app.request('/reports/2024')).status).toBe(404)
    })

    it('matches a pipe in a path key literally instead of as an alternation', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports/{id}/a|b'), (c) => c.text('matched'))

      expect((await app.request('/reports/1/a|b')).status).toBe(200)
      expect((await app.request('/reports/1/a')).status).toBe(404)
    })

    it('matches a segment that mixes a path parameter with escaped literal text', async () => {
      const app = new Hono()
      app.get(honoRouteFromPath('/reports/{id}:cancel'), (c) => c.text('matched'))

      expect((await app.request('/reports/1:cancel')).status).toBe(200)
      expect((await app.request('/reports/1')).status).toBe(404)
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
  })
})
