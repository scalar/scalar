import { beforeEach, describe, expect, it, vi } from 'vitest'

import { fetchUrls, getAbsoluteUrl } from './fetchUrls.ts'

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

describe('getAbsoluteUrl', () => {
  it('returns the URL if already absolute', () => {
    expect(getAbsoluteUrl('https://example.com/foobar.json')).toBe('https://example.com/foobar.json')
    expect(getAbsoluteUrl('http://example.com/foobar.json')).toBe('http://example.com/foobar.json')
  })

  it('returns the value as-is if no source provided', () => {
    expect(getAbsoluteUrl('foobar.json')).toBe('foobar.json')
    expect(getAbsoluteUrl('./foobar.json')).toBe('./foobar.json')
  })

  it('combines relative URL with absolute HTTP source', () => {
    expect(getAbsoluteUrl('./foobar.json', 'https://example.com/docs/openapi.yaml')).toBe(
      'https://example.com/docs/foobar.json',
    )
    expect(getAbsoluteUrl('../foobar.json', 'https://example.com/docs/openapi.yaml')).toBe(
      'https://example.com/foobar.json',
    )
  })

  it('handles complex relative paths correctly', () => {
    expect(getAbsoluteUrl('../../foobar.json', '/a/b/c/d/openapi.yaml')).toBe('/a/b/foobar.json')
    expect(getAbsoluteUrl('./foo/../bar/foobar.json', '/docs/openapi.yaml')).toBe('/docs/bar/foobar.json')
    expect(getAbsoluteUrl('../../../foobar.json', '/a/b/openapi.yaml')).toBe('/foobar.json')
  })

  it('preserves query parameters and fragments in URLs', () => {
    expect(getAbsoluteUrl('foobar.json?version=1', 'https://example.com/docs/openapi.yaml')).toBe(
      'https://example.com/docs/foobar.json?version=1',
    )
    expect(getAbsoluteUrl('foobar.json#components', 'https://example.com/docs/openapi.yaml')).toBe(
      'https://example.com/docs/foobar.json#components',
    )
  })
  it('combines two relative paths', () => {
    expect(getAbsoluteUrl('./components/pathItem.yaml', '/docs/openapi.yaml')).toBe('/docs/components/pathItem.yaml')
  })

  it('goes one level up with two relative paths', () => {
    expect(getAbsoluteUrl('../docs/components/pathItem.yaml', '/docs/openapi.yaml')).toBe(
      '/docs/components/pathItem.yaml',
    )
  })

  it('handles absolute paths with HTTP source URLs correctly', () => {
    expect(
      getAbsoluteUrl('/api/v31/components/schemas/category', 'https://petstore31.swagger.io/api/v31/openapi.json'),
    ).toBe('https://petstore31.swagger.io/api/v31/components/schemas/category')
    expect(
      getAbsoluteUrl('/api/v31/components/schemas/tag', 'https://petstore31.swagger.io/api/v31/components/schemas/pet'),
    ).toBe('https://petstore31.swagger.io/api/v31/components/schemas/tag')
  })

  it('handles nested references in HTTP URLs correctly', () => {
    // Test nested reference resolution
    expect(getAbsoluteUrl('./schemas/pet', 'https://petstore31.swagger.io/api/v31/components/index.json')).toBe(
      'https://petstore31.swagger.io/api/v31/components/schemas/pet',
    )
    expect(getAbsoluteUrl('../schemas/pet', 'https://petstore31.swagger.io/api/v31/components/nested/index.json')).toBe(
      'https://petstore31.swagger.io/api/v31/components/schemas/pet',
    )
  })

  it('preserves URL origin when resolving absolute paths', () => {
    expect(getAbsoluteUrl('/v2/pet', 'https://petstore31.swagger.io/api/v31/openapi.json')).toBe(
      'https://petstore31.swagger.io/v2/pet',
    )
    expect(
      getAbsoluteUrl('/api/v31/components/schemas/pet', 'https://petstore31.swagger.io/different/path/openapi.json'),
    ).toBe('https://petstore31.swagger.io/api/v31/components/schemas/pet')
  })
})
