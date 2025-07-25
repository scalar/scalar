import { afterEach, describe, expect, it } from 'vitest'

import { makeUrlAbsolute } from './make-url-absolute'

/**
 * @vitest-environment jsdom
 */
describe('makeUrlAbsolute', () => {
  const originalOrigin = window.location.origin

  afterEach(() => {
    // Restore original window.location.origin
    Object.defineProperty(window, 'location', {
      value: { origin: originalOrigin },
      writable: true,
    })
  })

  it('returns the same URL for absolute URLs', () => {
    expect(makeUrlAbsolute('http://example.com')).toBe('http://example.com')
    expect(makeUrlAbsolute('https://example.com')).toBe('https://example.com')
  })

  it('converts relative URLs to absolute URLs', () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path/' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/path/relative')
    expect(makeUrlAbsolute('/absolute-path')).toBe('http://example.com/absolute-path')
  })

  it('handles base URLs without trailing slash', () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/relative')
  })

  it('ignores query parameters and hash in base URL', () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path?query=1#hash' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/relative')
  })

  it('handles parent directory paths', () => {
    // Mock window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path/to/current/' },
      writable: true,
    })

    expect(makeUrlAbsolute('../openapi.json')).toBe('http://example.com/path/to/openapi.json')
  })

  it('handles base URLs with a path component', () => {
    expect(makeUrlAbsolute('examples/openapi.json', { baseUrl: 'http://localhost:5173/' })).toBe(
      'http://localhost:5173/examples/openapi.json',
    )
    expect(makeUrlAbsolute('examples/openapi.json', { baseUrl: 'http://localhost:5173' })).toBe(
      'http://localhost:5173/examples/openapi.json',
    )
  })

  describe('basePath functionality', () => {
    it('combines basePath with window.location.origin when no baseUrl provided', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://example.com' },
        writable: true,
      })

      expect(makeUrlAbsolute('api/docs', { basePath: '/app' })).toBe('http://example.com/app/api/docs')
    })

    it('combines basePath with provided baseUrl', () => {
      expect(
        makeUrlAbsolute('api/docs', {
          baseUrl: 'https://api.example.com',
          basePath: '/v1',
        }),
      ).toBe('https://api.example.com/v1/api/docs')
    })

    it('handles basePath without leading slash', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://example.com' },
        writable: true,
      })

      expect(makeUrlAbsolute('api/docs', { basePath: 'app' })).toBe('http://example.com/app/api/docs')
    })

    it('handles basePath with trailing slash', () => {
      // Mock window.location.origin
      Object.defineProperty(window, 'location', {
        value: { origin: 'http://example.com' },
        writable: true,
      })

      expect(makeUrlAbsolute('api/docs', { basePath: '/app/' })).toBe('http://example.com/app/api/docs')
    })

    it('ignores basePath for absolute URLs', () => {
      expect(makeUrlAbsolute('https://example.com/api', { basePath: '/app' })).toBe('https://example.com/api')
    })
  })
})
