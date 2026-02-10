import { describe, expect, it } from 'vitest'

import { isRemoteUrl } from '@/helpers/is-remote-url'

describe('valid remote URLs', () => {
  it.each([
    ['https://example.com/schema.json', 'https with path'],
    ['http://api.example.com/schemas/user.json', 'http with path'],
    ['https://example.com', 'https without path'],
    ['http://example.com', 'http without path'],
    ['https://example.com:8080/api', 'https with port'],
    ['http://localhost:3000/api', 'http localhost with port'],
    ['https://example.com/api?query=value', 'https with query string'],
    ['http://example.com#fragment', 'http with fragment'],
    ['https://example.com/path?query=1#hash', 'https with query and fragment'],
    ['https://user:pass@example.com', 'https with authentication'],
    ['http://192.168.1.1/api', 'http with IP address'],
    ['https://[2001:db8::1]/api', 'https with IPv6 address'],
    ['https://sub.domain.example.com/deep/path', 'https with subdomain and deep path'],
    ['http://example.com/path%20with%20spaces', 'http with encoded spaces'],
    ['https://example.com/path/to/file.json', 'https with file extension'],
  ])('returns true for %s (%s)', (url) => {
    expect(isRemoteUrl(url)).toBe(true)
  })
})

describe('non-remote URLs and invalid inputs', () => {
  it.each([
    ['file:///some/local/path', 'file protocol'],
    ['ftp://example.com/file', 'ftp protocol'],
    ['ws://example.com/socket', 'websocket protocol'],
    ['wss://example.com/socket', 'secure websocket protocol'],
    ['mailto:user@example.com', 'mailto protocol'],
    ['data:text/plain;base64,SGVsbG8=', 'data URL'],
    ['blob:https://example.com/uuid', 'blob URL'],
    ['#/components/schemas/User', 'JSON pointer'],
    ['./local-schema.json', 'relative path with dot'],
    ['../parent/schema.json', 'relative path with parent'],
    ['/absolute/path/file.json', 'absolute path'],
    ['random-string', 'plain string'],
    ['schema.json', 'filename only'],
    ['', 'empty string'],
    ['   ', 'whitespace only'],
    ['://invalid', 'malformed URL'],
    ['http://', 'incomplete URL'],
    ['https://', 'incomplete https URL'],
    ['htp://example.com', 'typo in protocol'],
    ['example.com', 'domain without protocol'],
    ['www.example.com', 'www without protocol'],
    ['//example.com/path', 'protocol-relative URL'],
    ['\\\\network\\share\\file', 'network share path'],
    ['C:\\Windows\\file.json', 'Windows path'],
  ])('returns false for %s (%s)', (input) => {
    expect(isRemoteUrl(input)).toBe(false)
  })
})

describe('edge cases', () => {
  it('handles URLs with special characters', () => {
    expect(isRemoteUrl('https://example.com/path?q=hello+world')).toBe(true)
    expect(isRemoteUrl('https://example.com/path?q=hello%20world')).toBe(true)
  })

  it('handles URLs with unicode characters', () => {
    expect(isRemoteUrl('https://例え.jp/パス')).toBe(true)
    expect(isRemoteUrl('https://example.com/café')).toBe(true)
  })

  it('handles URLs with multiple subdomains', () => {
    expect(isRemoteUrl('https://api.v2.staging.example.com/endpoint')).toBe(true)
  })

  it('handles URLs with unusual ports', () => {
    expect(isRemoteUrl('http://example.com:80/api')).toBe(true)
    expect(isRemoteUrl('https://example.com:443/api')).toBe(true)
    expect(isRemoteUrl('http://example.com:65535/api')).toBe(true)
  })

  it('handles localhost variations', () => {
    expect(isRemoteUrl('http://localhost/api')).toBe(true)
    expect(isRemoteUrl('http://127.0.0.1/api')).toBe(true)
    expect(isRemoteUrl('http://[::1]/api')).toBe(true)
  })

  it('handles extremely long URLs', () => {
    const longPath = 'a'.repeat(1000)
    expect(isRemoteUrl(`https://example.com/${longPath}`)).toBe(true)
  })

  it('handles URLs with many query parameters', () => {
    expect(isRemoteUrl('https://example.com/api?a=1&b=2&c=3&d=4&e=5&f=6&g=7&h=8&i=9&j=10')).toBe(true)
  })

  it('distinguishes between similar looking strings', () => {
    expect(isRemoteUrl('https://example.com')).toBe(true)
    expect(isRemoteUrl('https//example.com')).toBe(false)
    expect(isRemoteUrl('htps://example.com')).toBe(false)
  })
})
