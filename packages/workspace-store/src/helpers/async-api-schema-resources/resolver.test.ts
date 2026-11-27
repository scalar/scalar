import { describe, expect, it } from 'vitest'

import { createAsyncApiSchemaResourceResolver } from './resolver'

const format = 'application/vnd.google.protobuf;version=3'
const origin = 'https://example.test/root.proto'
const source = 'import "user.proto"; message Root { User user=1; }'
const user = 'message User { string id=1; }'

describe('resolver', () => {
  it('deduplicates simultaneous graphs and shared imports while requests are pending', async () => {
    const requested: string[] = []
    let complete: ((response: Response) => void) | undefined
    const resolve = createAsyncApiSchemaResourceResolver({
      origin,
      fetch: (input) => {
        requested.push(String(input))
        return new Promise<Response>((done) => {
          complete = done
        })
      },
    })
    const first = resolve(format, source)
    const second = resolve(format, source)
    const third = resolve(format, 'import "user.proto"; message Other { User member=1; }')
    expect(second).toBe(first)
    expect(requested).toStrictEqual(['https://example.test/user.proto'])
    if (!complete) throw new Error('Missing pending request')
    complete(new Response(user))
    const resources = { origin, files: { 'https://example.test/user.proto': user } }
    expect(await Promise.all([first, second, third])).toStrictEqual([resources, resources, resources])
    expect(await resolve(format, source)).toStrictEqual(resources)
    expect(requested).toStrictEqual(['https://example.test/user.proto'])
  })

  it('keeps failed graphs cached without returning partial files', async () => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      origin,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.reject(new Error('Unavailable'))
      },
    })
    expect(await resolve(format, source)).toStrictEqual({ origin, files: {}, failed: true })
    expect(await resolve(format, source)).toStrictEqual({ origin, files: {}, failed: true })
    expect(requested).toStrictEqual(['https://example.test/user.proto'])
  })

  it.each([undefined, origin])(
    'uses prebuilt server resources without downloading filesystem paths (origin: %s)',
    async (origin) => {
      const requested: string[] = []
      const resolve = createAsyncApiSchemaResourceResolver({
        origin,
        fetch: (input) => {
          requested.push(String(input))
          return Promise.reject(new Error('Must not fetch'))
        },
      })
      const resources = { origin: '/private/api.yaml', files: { '/private/user.proto': user } }
      expect(await resolve(format, source, resources)).toBe(resources)
      expect(requested).toStrictEqual([])
    },
  )

  it('uses the remote document location instead of a deferred filesystem origin', async () => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      origin,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          return Promise.resolve({ ok: true, data: user, raw: user })
        },
      },
    })
    expect(
      await resolve(format, source, { origin: 'file:///private/root.proto', files: {}, deferred: true }),
    ).toStrictEqual({
      origin,
      files: { 'https://example.test/user.proto': user },
    })
    expect(requested).toStrictEqual(['https://example.test/user.proto'])
  })

  it.each([
    { format, source: 'import "file:///private/user.proto";' },
    { format, source: 'import "ftp://example.test/user.proto";' },
    { format: 'application/raml+yaml;version=1.0', source: '!include file:///private/user.raml' },
    {
      format: 'application/raml+yaml;version=1.0',
      source: '#%RAML 1.0 DataType\nuses:\n  lib: file:///private/types.raml\ntype: lib.User',
    },
  ])('refuses non-HTTP dependencies in remote schemas ($source)', async ({ format, source }) => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      origin,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response(user))
      },
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          return Promise.resolve({ ok: true, data: user, raw: user })
        },
      },
    })
    expect(await resolve(format, source)).toStrictEqual({ origin, files: {}, failed: true })
    expect(requested).toStrictEqual([])
  })

  it('refuses nested filesystem imports in a remotely loaded dependency', async () => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      origin,
      fetch: (input) => {
        requested.push(String(input))
        return Promise.resolve(new Response('import "file:///private/user.proto";'))
      },
      fileLoader: {
        type: 'loader',
        validate: () => true,
        exec: (uri) => {
          requested.push(uri)
          return Promise.resolve({ ok: true, data: user, raw: user })
        },
      },
    })
    expect(await resolve(format, source)).toStrictEqual({ origin, files: {}, failed: true })
    expect(requested).toStrictEqual(['https://example.test/user.proto'])
  })

  it('allows local documents to use their configured filesystem loader', async () => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      origin: '/private/root.proto',
      fileLoader: {
        type: 'loader',
        validate: (uri) => uri === '/private/user.proto',
        exec: (uri) => {
          requested.push(uri)
          return Promise.resolve({ ok: true, data: user, raw: user })
        },
      },
    })
    expect(await resolve(format, source)).toStrictEqual({
      origin: '/private/root.proto',
      files: { '/private/user.proto': user },
    })
    expect(requested).toStrictEqual(['/private/user.proto'])
  })
})
