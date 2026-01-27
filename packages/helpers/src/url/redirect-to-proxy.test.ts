import { describe, expect, it } from 'vitest'

import { redirectToProxy, shouldUseProxy } from './redirect-to-proxy'

describe('redirectToProxy', () => {
  it('rewrites URLs', () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'https://example.com')).toBe(
      'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fexample.com',
    )
  })

  it('keeps query parameters', () => {
    expect(redirectToProxy('https://proxy.scalar.com?foo=bar', 'https://example.com')).toBe(
      'https://proxy.scalar.com/?foo=bar&scalar_url=https%3A%2F%2Fexample.com',
    )
  })

  it('uses the proxy when the proxyUrl is relative', () => {
    expect(redirectToProxy('/proxy', 'http://localhost:3000/api')).toBe(
      '/proxy?scalar_url=http%3A%2F%2Flocalhost%3A3000%2Fapi',
    )
  })

  it('skips the proxy if no proxy url is passed', () => {
    expect(redirectToProxy('', 'https://example.com')).toBe('https://example.com')
  })

  it('skips the proxy for relative URLs starting with a slash', () => {
    expect(redirectToProxy('https://proxy.scalar.com', '/api')).toBe('/api')
  })

  it('skips the proxy for relative URLs not starting with a slash', () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'api')).toBe('api')
  })

  it('skips the proxy for relative URLs not starting with a slash, but containing a dot', () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'openapi.json')).toBe('openapi.json')
  })

  it("uses the proxy when it's local", () => {
    expect(redirectToProxy('http://localhost:3000/proxy', 'http://localhost:3000/api')).toBe(
      'http://localhost:3000/proxy?scalar_url=http%3A%2F%2Flocalhost%3A3000%2Fapi',
    )
  })

  it('handles undefined url parameter', () => {
    expect(redirectToProxy('https://proxy.scalar.com', undefined)).toBe('')
  })

  it('handles undefined proxyUrl parameter', () => {
    expect(redirectToProxy(undefined, 'https://example.com')).toBe('https://example.com')
  })

  it('handles both parameters undefined', () => {
    expect(redirectToProxy(undefined, undefined)).toBe('')
  })

  it('handles malformed URLs gracefully', () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'not a valid url')).toBe('not a valid url')
  })

  it('preserves hash fragments in the original URL', () => {
    expect(redirectToProxy('https://proxy.scalar.com', 'https://example.com#section')).toBe(
      'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fexample.com%23section',
    )
  })

  it('handles proxy URLs with paths', () => {
    expect(redirectToProxy('https://proxy.scalar.com/v1/proxy', 'https://example.com')).toBe(
      'https://proxy.scalar.com/v1/proxy?scalar_url=https%3A%2F%2Fexample.com',
    )
  })

  it('handles relative proxy URLs with query parameters', () => {
    expect(redirectToProxy('/proxy?key=value', 'https://example.com')).toBe(
      '/proxy?key=value&scalar_url=https%3A%2F%2Fexample.com',
    )
  })
})

describe('shouldUseProxy', () => {
  it('returns false when proxyUrl is missing', () => {
    expect(shouldUseProxy(undefined, 'https://example.com')).toBe(false)
  })

  it('returns false when url is missing', () => {
    expect(shouldUseProxy('https://proxy.scalar.com', undefined)).toBe(false)
  })

  it('returns false when both parameters are missing', () => {
    expect(shouldUseProxy(undefined, undefined)).toBe(false)
  })

  it('returns false for relative URLs', () => {
    expect(shouldUseProxy('https://proxy.scalar.com', '/api')).toBe(false)
    expect(shouldUseProxy('https://proxy.scalar.com', 'api/endpoint')).toBe(false)
    expect(shouldUseProxy('https://proxy.scalar.com', './api')).toBe(false)
  })

  it('returns true for relative proxy URLs', () => {
    expect(shouldUseProxy('/proxy', 'https://example.com')).toBe(true)
    expect(shouldUseProxy('/proxy', 'http://localhost:3000')).toBe(true)
  })

  it('returns true for local proxy URLs', () => {
    expect(shouldUseProxy('http://localhost:3000/proxy', 'https://example.com')).toBe(true)
    expect(shouldUseProxy('http://127.0.0.1:8080/proxy', 'https://example.com')).toBe(true)
  })

  it('returns false for localhost URLs with remote proxy', () => {
    expect(shouldUseProxy('https://proxy.scalar.com', 'http://localhost:3000')).toBe(false)
    expect(shouldUseProxy('https://proxy.scalar.com', 'http://127.0.0.1:8080')).toBe(false)
  })

  it('returns true for local proxy with local URL', () => {
    expect(shouldUseProxy('http://localhost:3000/proxy', 'http://localhost:3000/api')).toBe(true)
  })

  it('returns true for remote proxy with remote URL', () => {
    expect(shouldUseProxy('https://proxy.scalar.com', 'https://api.example.com')).toBe(true)
  })

  it('returns false for empty strings', () => {
    expect(shouldUseProxy('', 'https://example.com')).toBe(false)
    expect(shouldUseProxy('https://proxy.scalar.com', '')).toBe(false)
  })
})
