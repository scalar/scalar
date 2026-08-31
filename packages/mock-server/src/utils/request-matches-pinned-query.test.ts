import { Hono } from 'hono'
import { describe, expect, it } from 'vitest'

import { requestMatchesPinnedQuery } from './request-matches-pinned-query'
import type { PinnedQueryParameter } from './split-path-key'

/** Run the predicate against a request, so it sees a real Hono context. */
const matches = async (url: string, query: PinnedQueryParameter[]): Promise<boolean> => {
  const app = new Hono()

  let result: boolean | undefined
  app.get('/*', (c) => {
    result = requestMatchesPinnedQuery(c, query)

    return c.text('')
  })

  await app.request(url)

  return result ?? false
}

describe('requestMatchesPinnedQuery', () => {
  it('matches when nothing is pinned', async () => {
    expect(await matches('/v1/messages', [])).toBe(true)
  })

  it('matches a pinned name and value', async () => {
    expect(await matches('/v1/messages?beta=true', [{ name: 'beta', value: 'true' }])).toBe(true)
  })

  it('rejects a different value', async () => {
    expect(await matches('/v1/messages?beta=false', [{ name: 'beta', value: 'true' }])).toBe(false)
  })

  it('rejects a missing parameter', async () => {
    expect(await matches('/v1/messages', [{ name: 'beta', value: 'true' }])).toBe(false)
  })

  it('matches any value when only the name is pinned', async () => {
    expect(await matches('/v1/messages?beta=whatever', [{ name: 'beta', value: undefined }])).toBe(true)
    expect(await matches('/v1/messages?beta', [{ name: 'beta', value: undefined }])).toBe(true)
  })

  it('matches when one of the repeated values is the pinned one', async () => {
    expect(await matches('/v1/messages?beta=false&beta=true', [{ name: 'beta', value: 'true' }])).toBe(true)
  })

  it('requires every pinned parameter', async () => {
    const query = [
      { name: 'beta', value: 'true' },
      { name: 'version', value: '2' },
    ]

    expect(await matches('/v1/messages?beta=true&version=2', query)).toBe(true)
    expect(await matches('/v1/messages?beta=true', query)).toBe(false)
  })

  it('ignores extra query parameters', async () => {
    expect(await matches('/v1/messages?beta=true&extra=1', [{ name: 'beta', value: 'true' }])).toBe(true)
  })

  it('compares names and values case-sensitively', async () => {
    expect(await matches('/v1/messages?Beta=true', [{ name: 'beta', value: 'true' }])).toBe(false)
    expect(await matches('/v1/messages?beta=TRUE', [{ name: 'beta', value: 'true' }])).toBe(false)
  })

  it('matches a percent-encoded value', async () => {
    expect(await matches('/v1/messages?q=hello%20world', [{ name: 'q', value: 'hello world' }])).toBe(true)
  })
})
