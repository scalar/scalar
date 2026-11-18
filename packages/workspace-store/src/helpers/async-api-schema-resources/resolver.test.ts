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

  it('uses prebuilt server resources without downloading filesystem paths', async () => {
    const requested: string[] = []
    const resolve = createAsyncApiSchemaResourceResolver({
      fetch: (input) => {
        requested.push(String(input))
        return Promise.reject(new Error('Must not fetch'))
      },
    })
    const resources = { origin: '/private/api.yaml', files: { '/private/user.proto': user } }
    expect(await resolve(format, source, resources)).toBe(resources)
    expect(requested).toStrictEqual([])
  })
})
