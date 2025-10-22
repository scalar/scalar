import { afterEach, describe, expect, it, vi } from 'vitest'

import { fetchUrls } from './fetch-urls'

const globalFetchSpy = vi.spyOn(global, 'fetch')
afterEach(() => {
  globalFetchSpy.mockReset()
})

describe('fetchUrls', () => {
  it('returns true for an url', () => {
    expect(fetchUrls().check('http://example.com/specification/openapi.yaml')).toBe(true)
  })

  it('returns false for a filename', () => {
    expect(fetchUrls().check('openapi.yaml')).toBe(false)
  })

  it('returns false for a path', () => {
    expect(fetchUrls().check('specification/openapi.yaml')).toBe(false)
  })

  it('returns false for an object', () => {
    expect(fetchUrls().check({})).toBe(false)
  })

  it('returns false for undefined', () => {
    expect(fetchUrls().check()).toBe(false)
  })

  it('fetches the URL', async () => {
    // @ts-expect-error
    globalFetchSpy.mockImplementation(async (url: string) => ({
      text: () => {
        if (url === 'http://example.com/specification/openapi.yaml') {
          return 'OK'
        }

        throw new Error('Not found')
      },
    }))

    expect(await fetchUrls().get('http://example.com/specification/openapi.yaml')).toBe('OK')
  })

  it('rewrites the URL', async () => {
    // @ts-expect-error
    globalFetchSpy.mockImplementation(async (url: string) => ({
      text: () => {
        if (url === 'http://foobar.com/specification/openapi.yaml') {
          return 'OK'
        }
        throw new Error('Not found')
      },
    }))

    expect(
      await fetchUrls({
        fetch: (url) => fetch(url.replace('example', 'foobar')),
      }).get('http://foobar.com/specification/openapi.yaml'),
    ).toBe('OK')
  })
})
