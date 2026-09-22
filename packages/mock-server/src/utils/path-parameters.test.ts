import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { honoRouteFromPath } from './hono-route-from-path'
import { pathParameters } from './path-parameters'

/** Register a path key and report the parameters a request to it exposes. */
const parametersFor = async (pathKey: string, requestPath: string): Promise<Record<string, string>> => {
  const app = new Hono()
  app.get(honoRouteFromPath(pathKey), (c) => c.json(pathParameters(c)))

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

  it('keeps a declared parameter that is named like a synthesized one', async () => {
    expect(await parametersFor('/a/{__scalar_literal_0}', '/a/hello')).toStrictEqual({
      __scalar_literal_0: 'hello',
    })
  })
})
