import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUrls } from './fetchUrls.ts'

global.fetch = vi.fn()

describe('fetchUrls', async () => {
  beforeEach(() => {
    // @ts-expect-error
    global.fetch.mockReset()
  })

  it('returns true for an url', async () => {
    expect(fetchUrls().check('http://example.com/examples/openapi.yaml')).toBe(true)
  })

  it('returns true for a filename', async () => {
    expect(fetchUrls().check('openapi.yaml')).toBe(true)
  })

  it('returns true for a path', async () => {
    expect(fetchUrls().check('examples/openapi.yaml')).toBe(true)
  })

  it('returns false for an object', async () => {
    expect(fetchUrls().check({})).toBe(false)
  })

  it('returns false for undefinded', async () => {
    expect(fetchUrls().check()).toBe(false)
  })

  it('fetches the URL', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => ({
      text: async () => {
        if (url === 'http://example.com/examples/openapi.yaml') {
          return 'OK'
        }

        throw new Error('Not found')
      },
    }))

    expect(await fetchUrls().get('http://example.com/examples/openapi.yaml')).toBe('OK')
  })

  it('rewrites the URL', async () => {
    // @ts-expect-error
    fetch.mockImplementation(async (url: string) => ({
      text: async () => {
        if (url === 'http://example.com/examples/openapi.yaml') {
          return 'OK'
        }

        throw new Error('Not found')
      },
    }))

    expect(
      await fetchUrls({
        fetch: (url) => fetch(url.replace('foobar', 'example')),
      }).get('http://foobar.com/examples/openapi.yaml'),
    ).toBe('OK')
  })
})
