import { describe, expect, it } from 'vitest'

import { fetchUrls } from './fetchUrls'

describe('fetchUrls', async () => {
  it('returns true for an url', async () => {
    expect(
      fetchUrls().check('http://example.com/specification/openapi.yaml'),
    ).toBe(true)
  })

  it('returns false for a filename', async () => {
    expect(fetchUrls().check('openapi.yaml')).toBe(false)
  })

  it('returns false for a path', async () => {
    expect(fetchUrls().check('specification/openapi.yaml')).toBe(false)
  })

  it('returns false for an object', async () => {
    expect(fetchUrls().check({})).toBe(false)
  })

  it('returns false for undefinded', async () => {
    expect(fetchUrls().check()).toBe(false)
  })

  it('fetches the URL', async () => {
    global.fetch = async (url: string) =>
      ({
        text: async () => {
          if (url === 'http://example.com/specification/openapi.yaml') {
            return 'OK'
          }

          throw new Error('Not found')
        },
      }) as Response

    expect(
      await fetchUrls().get('http://example.com/specification/openapi.yaml'),
    ).toBe('OK')
  })

  it('rewrites the URL', async () => {
    global.fetch = async (url: string) =>
      ({
        text: async () => {
          if (url === 'http://foobar.com/specification/openapi.yaml') {
            return 'OK'
          }

          throw new Error('Not found')
        },
      }) as Response

    expect(
      await fetchUrls({
        fetch: (url) => fetch(url.replace('example', 'foobar')),
      }).get('http://foobar.com/specification/openapi.yaml'),
    ).toBe('OK')
  })
})
