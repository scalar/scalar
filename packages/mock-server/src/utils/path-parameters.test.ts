import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { honoRouteFromPath } from './hono-route-from-path'
import { setMockedOperation } from './mocked-operation'
import { pathParameters } from './path-parameters'

/** Register a path key and report the parameters a request to it exposes. */
const parametersFor = async (pathKey: string, requestPath: string): Promise<Record<string, string>> => {
  const app = new Hono()
  app.get(honoRouteFromPath(pathKey), (c) => {
    setMockedOperation(c, { method: 'get', path: pathKey }, {})

    return c.json(pathParameters(c))
  })

  return await (await app.request(requestPath)).json()
}

describe('pathParameters', () => {
  it('returns the declared path parameters', async () => {
    expect(await parametersFor('/users/{userId}/posts/{postId}', '/users/1/posts/2')).toStrictEqual({
      userId: '1',
      postId: '2',
    })
  })

  it('returns nothing for a path without parameters', async () => {
    expect(await parametersFor('/users', '/users')).toStrictEqual({})
  })

  it('hides the parameter synthesized for an escaped segment', async () => {
    expect(await parametersFor('/{id}/users:batchGet', '/1/users:batchGet')).toStrictEqual({ id: '1' })
  })

  it.each([
    ['/files/{id}.json', '/files/42.json', { id: '42' }],
    ['/jobs/{id}:cancel', '/jobs/a:b:cancel', { id: 'a:b' }],
    ['/api/v{version}/status', '/api/v2/status', { version: '2' }],
    ['/range/{from}-{to}', '/range/2024-01-2025', { from: '2024', to: '01-2025' }],
    ['/range/{from}-{to}', '/range/-1-5', { from: '-1', to: '5' }],
    ['/range/{from}-{to}', '/range/-1--5', { from: '-1', to: '-5' }],
    ['/range/{from}-{to}', '/range/1--5', { from: '1', to: '-5' }],
    ['/files/{name}.{ext}', '/files/.env.json', { name: '.env', ext: 'json' }],
    ['/files/{name}.{ext}', '/files/archive.tar.gz', { name: 'archive', ext: 'tar.gz' }],
    ['/users/{userId}/files/{id}.json', '/users/7/files/42.json', { userId: '7', id: '42' }],
    ['/files/{id}.json', '/files/a%20b.json', { id: 'a b' }],
    ['/files/{id}.json', '/files/a%2Fb.json', { id: 'a/b' }],
    ['/files/{id}.json?beta=true', '/files/42.json', { id: '42' }],
    ['/items/{id}-v{version}', '/items/123e4567-e89b-v2', { id: '123e4567-e89b', version: '2' }],
    ['/pairs/{a},{b}', '/pairs/1%2C2,3', { a: '1,2', b: '3' }],
    ['/pairs/{a}:{b}', '/pairs/1%3A2:3', { a: '1:2', b: '3' }],
    ['/files/{id}.json', '/files/bad%E0.json', { id: 'bad%E0' }],
    ['/{__scalar_literal_0}/{id}.json', '/abc/42.json', { __scalar_literal_0: 'abc', id: '42' }],
  ])('binds the parameters of a segment with literal text: %s', async (pathKey, requestPath, expected) => {
    expect(await parametersFor(pathKey, requestPath)).toStrictEqual(expected)
  })

  it('decodes a value in a segment with literal text like a whole-segment value', async () => {
    expect(await parametersFor('/files/{id}.json', '/files/a%2520b.json')).toStrictEqual(
      await parametersFor('/files/{id}', '/files/a%2520b'),
    )
  })

  it('binds the parameters of a segment with literal text under a base path', async () => {
    const app = new Hono()
    const pathKey = '/files/{id}.json'
    const server = new Hono()
    server.get(honoRouteFromPath(pathKey), (c) => {
      setMockedOperation(c, { method: 'get', path: pathKey }, {})

      return c.json(pathParameters(c))
    })
    app.route('/base/v1', server)

    expect(await (await app.request('/base/v1/files/42.json')).json()).toStrictEqual({ id: '42' })
  })

  it('leaves templates with nothing between them unbound', async () => {
    expect(await parametersFor('/files/{a}{b}-{c}', '/files/xy-z')).toStrictEqual({ c: 'z' })
  })

  it('keeps a declared parameter that is named like a synthesized one', async () => {
    expect(await parametersFor('/a/{__scalar_literal_0}', '/a/hello')).toStrictEqual({
      __scalar_literal_0: 'hello',
    })
  })
})
