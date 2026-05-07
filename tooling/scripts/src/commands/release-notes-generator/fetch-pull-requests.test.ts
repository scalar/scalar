import { describe, expect, it, vi } from 'vitest'

import { extractPullRequestNumbers, fetchPullRequests } from './fetch-pull-requests'

describe('extractPullRequestNumbers', () => {
  it('extracts numbers from changeset-style links', () => {
    const section = [
      '- [#9049](https://github.com/scalar/scalar/pull/9049): fix something',
      '- [#9023](https://github.com/scalar/scalar/pull/9023): chore: noise',
    ].join('\n')
    expect(extractPullRequestNumbers(section)).toEqual([9023, 9049])
  })

  it('deduplicates the same PR appearing more than once', () => {
    const section = [
      '- [#9045](https://github.com/scalar/scalar/pull/9045): minor change A',
      '- [#9045](https://github.com/scalar/scalar/pull/9045): minor change B',
      '- [#9045](https://github.com/scalar/scalar/pull/9045): patch change C',
    ].join('\n')
    expect(extractPullRequestNumbers(section)).toEqual([9045])
  })

  it('also matches bare #1234 references', () => {
    expect(extractPullRequestNumbers('see #1234 for context')).toEqual([1234])
  })

  it('returns an empty array when no PRs are referenced', () => {
    expect(extractPullRequestNumbers('- abcdef0: chore: noisy commit')).toEqual([])
  })
})

const buildPullResponse = (payload: unknown, init: ResponseInit = { status: 200 }): Response => {
  return new Response(JSON.stringify(payload), {
    ...init,
    headers: { 'content-type': 'application/json', ...(init.headers ?? {}) },
  })
}

describe('fetchPullRequests', () => {
  it('returns a map keyed by PR number with title and body', async () => {
    const fetchImpl = vi.fn((url: RequestInfo | URL) => {
      const number = String(url).split('/').pop()
      return Promise.resolve(
        buildPullResponse({
          number: Number(number),
          title: `PR ${number}`,
          body: `Body of ${number}`,
        }),
      )
    })

    const result = await fetchPullRequests({
      numbers: [1, 2],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result.size).toBe(2)
    expect(result.get(1)).toEqual({ number: 1, title: 'PR 1', body: 'Body of 1' })
    expect(result.get(2)).toEqual({ number: 2, title: 'PR 2', body: 'Body of 2' })
    expect(fetchImpl).toHaveBeenCalledTimes(2)
  })

  it('includes the bearer token when provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => buildPullResponse({ number: 1, title: 'x', body: '' }))

    await fetchPullRequests({
      numbers: [1],
      token: 'gh-token',
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers.authorization).toBe('Bearer gh-token')
    expect(headers.accept).toBe('application/vnd.github+json')
  })

  it('omits the authorization header when no token is provided', async () => {
    const fetchImpl = vi.fn<typeof fetch>(async () => buildPullResponse({ number: 1, title: 'x', body: '' }))

    await fetchPullRequests({
      numbers: [1],
      fetchImpl,
    })

    const init = fetchImpl.mock.calls[0]?.[1] as RequestInit | undefined
    const headers = (init?.headers ?? {}) as Record<string, string>
    expect(headers.authorization).toBeUndefined()
  })

  it('skips PRs that fail to fetch but keeps the rest', async () => {
    const fetchImpl = vi.fn((url: RequestInfo | URL) => {
      if (String(url).endsWith('/2')) {
        return Promise.resolve(new Response('rate limited', { status: 403 }))
      }
      return Promise.resolve(buildPullResponse({ number: 1, title: 'PR 1', body: 'Body 1' }))
    })

    const result = await fetchPullRequests({
      numbers: [1, 2],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result.size).toBe(1)
    expect(result.get(1)?.title).toBe('PR 1')
    expect(result.has(2)).toBe(false)
  })

  it('skips PRs without a title', async () => {
    const fetchImpl = vi.fn(async () => buildPullResponse({ number: 1, title: '', body: 'something' }))

    const result = await fetchPullRequests({
      numbers: [1],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result.size).toBe(0)
  })

  it('truncates very long PR bodies', async () => {
    const longBody = 'x'.repeat(10000)
    const fetchImpl = vi.fn(async () => buildPullResponse({ number: 1, title: 'big', body: longBody }))

    const result = await fetchPullRequests({
      numbers: [1],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    const summary = result.get(1)
    expect(summary).toBeDefined()
    expect(summary?.body.length).toBeLessThan(longBody.length)
    expect(summary?.body.endsWith('[truncated]')).toBe(true)
  })

  it('returns an empty map when no numbers are provided', async () => {
    const fetchImpl = vi.fn()
    const result = await fetchPullRequests({
      numbers: [],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result.size).toBe(0)
    expect(fetchImpl).not.toHaveBeenCalled()
  })

  it('continues past network errors instead of throwing', async () => {
    const fetchImpl = vi.fn((url: RequestInfo | URL) => {
      if (String(url).endsWith('/1')) {
        return Promise.reject(new Error('boom'))
      }
      return Promise.resolve(buildPullResponse({ number: 2, title: 'PR 2', body: '' }))
    })

    const result = await fetchPullRequests({
      numbers: [1, 2],
      fetchImpl: fetchImpl as unknown as typeof fetch,
    })

    expect(result.size).toBe(1)
    expect(result.get(2)?.title).toBe('PR 2')
  })
})
