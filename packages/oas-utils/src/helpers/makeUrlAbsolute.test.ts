import { describe, expect, it } from 'vitest'

import { makeUrlAbsolute } from './makeUrlAbsolute'

/**
 * @vitest-environment jsdom
 */
describe('makeUrlAbsolute', () => {
  it('should return undefined for undefined input', () => {
    expect(makeUrlAbsolute(undefined)).toBeUndefined()
  })

  it('should return the same URL for absolute URLs', () => {
    expect(makeUrlAbsolute('http://example.com')).toBe('http://example.com')
    expect(makeUrlAbsolute('https://example.com')).toBe('https://example.com')
  })

  it('should convert relative URLs to absolute URLs', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path/' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/path/relative')
    expect(makeUrlAbsolute('/absolute-path')).toBe(
      'http://example.com/absolute-path',
    )

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('should handle base URLs without trailing slash', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/path/relative')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })

  it('should ignore query parameters and hash in base URL', () => {
    // Mock window.location.href
    const originalHref = window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: 'http://example.com/path?query=1#hash' },
      writable: true,
    })

    expect(makeUrlAbsolute('relative')).toBe('http://example.com/path/relative')

    // Restore original window.location.href
    Object.defineProperty(window, 'location', {
      value: { href: originalHref },
      writable: true,
    })
  })
})
