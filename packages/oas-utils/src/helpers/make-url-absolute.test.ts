import { describe, expect, it } from 'vitest'

import { makeUrlAbsolute } from './make-url-absolute'

/**
 * @vitest-environment jsdom
 */
describe('makeUrlAbsolute', () => {
  it('returns undefined for undefined input', () => {
    expect(makeUrlAbsolute(undefined)).toBeUndefined()
  })

  it('returns the same URL for absolute URLs', () => {
    expect(makeUrlAbsolute('http://example.com')).toBe('http://example.com')
    expect(makeUrlAbsolute('https://example.com')).toBe('https://example.com')
  })

  it('converts relative URLs to absolute URLs', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path/' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/path/relative')
    expect(makeUrlAbsolute('/absolute-path')).toBe('http://example.com/absolute-path')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('handles base URLs without trailing slash', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/relative')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('ignores query parameters and hash in base URL', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path?query=1#hash' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/relative')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('handles parent directory paths', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path/to/current/' },
      writable: true,
    })

    expect(makeUrlAbsolute('../openapi.json')).toBe('http://example.com/path/to/openapi.json')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })
})
