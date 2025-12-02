import { describe, expect, it } from 'vitest'

import { isUrl } from './is-url'

describe('isUrl', () => {
  it('returns true for valid http URL', () => {
    const result = isUrl('http://example.com')
    expect(result).toBe(true)
  })

  it('returns true for valid https URL', () => {
    const result = isUrl('https://example.com')
    expect(result).toBe(true)
  })

  it('returns true for http URL with path', () => {
    const result = isUrl('http://example.com/api/users')
    expect(result).toBe(true)
  })

  it('returns true for https URL with path', () => {
    const result = isUrl('https://example.com/api/users')
    expect(result).toBe(true)
  })

  it('returns true for http URL with query parameters', () => {
    const result = isUrl('http://example.com?key=value')
    expect(result).toBe(true)
  })

  it('returns true for https URL with query parameters', () => {
    const result = isUrl('https://example.com?key=value')
    expect(result).toBe(true)
  })

  it('returns true for http URL with port', () => {
    const result = isUrl('http://localhost:3000')
    expect(result).toBe(true)
  })

  it('returns true for https URL with port', () => {
    const result = isUrl('https://localhost:3000')
    expect(result).toBe(true)
  })

  it('returns true for http URL with fragment', () => {
    const result = isUrl('http://example.com#section')
    expect(result).toBe(true)
  })

  it('returns true for https URL with fragment', () => {
    const result = isUrl('https://example.com#section')
    expect(result).toBe(true)
  })

  it('returns true for http URL with subdomain', () => {
    const result = isUrl('http://api.example.com')
    expect(result).toBe(true)
  })

  it('returns true for https URL with subdomain', () => {
    const result = isUrl('https://api.example.com')
    expect(result).toBe(true)
  })

  it('returns true for http URL with IP address', () => {
    const result = isUrl('http://192.168.1.1')
    expect(result).toBe(true)
  })

  it('returns true for https URL with IP address', () => {
    const result = isUrl('https://192.168.1.1')
    expect(result).toBe(true)
  })

  it('returns true for http URL with authentication', () => {
    const result = isUrl('http://user:pass@example.com')
    expect(result).toBe(true)
  })

  it('returns true for https URL with authentication', () => {
    const result = isUrl('https://user:pass@example.com')
    expect(result).toBe(true)
  })

  it('returns false for URL without protocol', () => {
    const result = isUrl('example.com')
    expect(result).toBe(false)
  })

  it('returns false for ftp URL', () => {
    const result = isUrl('ftp://example.com')
    expect(result).toBe(false)
  })

  it('returns false for file URL', () => {
    const result = isUrl('file:///path/to/file')
    expect(result).toBe(false)
  })

  it('returns false for relative path', () => {
    const result = isUrl('./path/to/file')
    expect(result).toBe(false)
  })

  it('returns false for absolute path', () => {
    const result = isUrl('/path/to/file')
    expect(result).toBe(false)
  })

  it('returns false for empty string', () => {
    const result = isUrl('')
    expect(result).toBe(false)
  })

  it('returns false for whitespace-only string', () => {
    const result = isUrl('   ')
    expect(result).toBe(false)
  })

  it('returns false for random text', () => {
    const result = isUrl('not a url')
    expect(result).toBe(false)
  })

  it('returns false for URL-like string without protocol', () => {
    const result = isUrl('www.example.com')
    expect(result).toBe(false)
  })

  it('returns false for https with malformed URL', () => {
    const result = isUrl('https://invalid url with spaces')
    expect(result).toBe(false)
  })

  it('returns true for http URL with encoded spaces', () => {
    const result = isUrl('http://example.com/path%20with%20spaces')
    expect(result).toBe(true)
  })

  it('returns true for https URL with encoded spaces', () => {
    const result = isUrl('https://example.com/path%20with%20spaces')
    expect(result).toBe(true)
  })

  it('returns true for http URL with special characters', () => {
    const result = isUrl('http://example.com/path?query=value&other=123')
    expect(result).toBe(true)
  })

  it('returns true for https URL with special characters', () => {
    const result = isUrl('https://example.com/path?query=value&other=123')
    expect(result).toBe(true)
  })

  it('returns true for http URL with unicode characters', () => {
    const result = isUrl('http://例え.jp')
    expect(result).toBe(true)
  })

  it('returns true for https URL with unicode characters', () => {
    const result = isUrl('https://例え.jp')
    expect(result).toBe(true)
  })

  it('returns false for https-like string without colon', () => {
    const result = isUrl('https//example.com')
    expect(result).toBe(false)
  })

  it('returns false for http-like string without colon', () => {
    const result = isUrl('http//example.com')
    expect(result).toBe(false)
  })

  it('returns true for http localhost', () => {
    const result = isUrl('http://localhost')
    expect(result).toBe(true)
  })

  it('returns true for https localhost', () => {
    const result = isUrl('https://localhost')
    expect(result).toBe(true)
  })

  it('returns true for http with complex path', () => {
    const result = isUrl('http://api.example.com/v1/users/123/posts?limit=10&offset=20')
    expect(result).toBe(true)
  })

  it('returns true for https with complex path', () => {
    const result = isUrl('https://api.example.com/v1/users/123/posts?limit=10&offset=20')
    expect(result).toBe(true)
  })

  it('returns false for string starting with http but not http://', () => {
    const result = isUrl('httpx://example.com')
    expect(result).toBe(false)
  })

  it('returns false for string starting with https but not https://', () => {
    const result = isUrl('httpsx://example.com')
    expect(result).toBe(false)
  })

  it('returns false for URL with only protocol', () => {
    const result = isUrl('http://')
    expect(result).toBe(false)
  })

  it('returns false for URL with only https protocol', () => {
    const result = isUrl('https://')
    expect(result).toBe(false)
  })

  it('handles case sensitivity for http protocol', () => {
    const result = isUrl('HTTP://example.com')
    expect(result).toBe(false)
  })

  it('handles case sensitivity for https protocol', () => {
    const result = isUrl('HTTPS://example.com')
    expect(result).toBe(false)
  })
})
