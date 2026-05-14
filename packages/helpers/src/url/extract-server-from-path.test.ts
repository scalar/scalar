import { describe, expect, it } from 'vitest'

import { extractServerFromPath } from './extract-server-from-path'

describe('extractServer', () => {
  it('returns null for empty or invalid inputs', () => {
    expect(extractServerFromPath('')).toBeNull()
    expect(extractServerFromPath(undefined)).toBeNull()
    expect(extractServerFromPath('   ')).toBeNull()
  })

  it('extracts server from basic HTTPS and HTTP URLs', () => {
    expect(extractServerFromPath('https://api.example.com')).toEqual(['https://api.example.com', '/'])
    expect(extractServerFromPath('http://api.example.com')).toEqual(['http://api.example.com', '/'])
    expect(extractServerFromPath('https://api.example.com/v1/users')).toEqual(['https://api.example.com', '/v1/users'])
  })

  it('extracts bare-hostname URLs without a protocol', () => {
    expect(extractServerFromPath('google.com')).toEqual(['google.com', '/'])
    expect(extractServerFromPath('google.com/v1/users')).toEqual(['google.com', '/v1/users'])
    expect(extractServerFromPath('api.example.com')).toEqual(['api.example.com', '/'])
    expect(extractServerFromPath('api.example.com/v1/users')).toEqual(['api.example.com', '/v1/users'])
    expect(extractServerFromPath('api.example.com:8080/v1/users')).toEqual(['api.example.com:8080', '/v1/users'])
    expect(extractServerFromPath('api.example.com/search?q=test#section')).toEqual([
      'api.example.com',
      '/search?q=test#section',
    ])
  })

  it('returns null for protocol-less inputs that are not hostnames', () => {
    expect(extractServerFromPath('api/v1/users')).toBeNull()
    expect(extractServerFromPath('localhost')).toBeNull()
    expect(extractServerFromPath('users')).toBeNull()
  })

  it('normalizes standard ports and preserves custom ports', () => {
    expect(extractServerFromPath('https://api.example.com:443')).toEqual(['https://api.example.com', '/'])
    expect(extractServerFromPath('http://api.example.com:80')).toEqual(['http://api.example.com', '/'])
    expect(extractServerFromPath('https://api.example.com:8443')).toEqual(['https://api.example.com:8443', '/'])
    expect(extractServerFromPath('http://localhost:3000')).toEqual(['http://localhost:3000', '/'])
  })

  it('extracts server from localhost and IP addresses', () => {
    expect(extractServerFromPath('http://localhost:3000/api/v1')).toEqual(['http://localhost:3000', '/api/v1'])
    expect(extractServerFromPath('http://192.168.1.1:8080/api')).toEqual(['http://192.168.1.1:8080', '/api'])
    expect(extractServerFromPath('http://[2001:db8::1]:8080/api')).toEqual(['http://[2001:db8::1]:8080', '/api'])
  })

  it('handles subdomains and complex domains', () => {
    expect(extractServerFromPath('https://api.staging.example.com/v1/users')).toEqual([
      'https://api.staging.example.com',
      '/v1/users',
    ])
    expect(extractServerFromPath('https://v1.api.staging.example.com')).toEqual([
      'https://v1.api.staging.example.com',
      '/',
    ])
  })

  it('strips authentication credentials from URLs', () => {
    expect(extractServerFromPath('https://user:pass@api.example.com')).toEqual(['https://api.example.com', '/'])
    expect(extractServerFromPath('https://user:pass@api.example.com:8443/v1/users')).toEqual([
      'https://api.example.com:8443',
      '/v1/users',
    ])
  })

  it('handles protocol-relative URLs', () => {
    expect(extractServerFromPath('//api.example.com/v1/users')).toEqual(['//api.example.com', '/v1/users'])
    expect(extractServerFromPath('//api.example.com:8080/v1/users')).toEqual(['//api.example.com:8080', '/v1/users'])
    expect(extractServerFromPath('//localhost:3000')).toEqual(['//localhost:3000', '/'])
  })

  it('handles different URL schemes', () => {
    expect(extractServerFromPath('ws://api.example.com')).toEqual(['ws://api.example.com', '/'])
    expect(extractServerFromPath('wss://api.example.com')).toEqual(['wss://api.example.com', '/'])
    expect(extractServerFromPath('ftp://files.example.com')).toEqual(['ftp://files.example.com', '/'])
    expect(extractServerFromPath('file:///path/to/file')).toBeNull()
  })

  it('validates port numbers', () => {
    expect(extractServerFromPath('https://api.example.com:65535')).toEqual(['https://api.example.com:65535', '/'])
    expect(extractServerFromPath('https://api.example.com:99999')).toBeNull()
    expect(extractServerFromPath('https://api.example.com:-1')).toBeNull()
    expect(extractServerFromPath('https://api.example.com:abc')).toBeNull()
  })

  it('handles internationalized domains', () => {
    expect(extractServerFromPath('https://api.münchen.de')).toEqual(['https://api.xn--mnchen-3ya.de', '/'])
    expect(extractServerFromPath('https://api.xn--mnchen-3ya.de')).toEqual(['https://api.xn--mnchen-3ya.de', '/'])
  })

  it('extracts server from real-world API URLs', () => {
    expect(extractServerFromPath('https://api.github.com/repos/scalar/scalar')).toEqual([
      'https://api.github.com',
      '/repos/scalar/scalar',
    ])
    expect(extractServerFromPath('https://abc123.execute-api.us-east-1.amazonaws.com/prod/users')).toEqual([
      'https://abc123.execute-api.us-east-1.amazonaws.com',
      '/prod/users',
    ])
    expect(extractServerFromPath('https://my-app-abc123.vercel.app/api/data')).toEqual([
      'https://my-app-abc123.vercel.app',
      '/api/data',
    ])
  })

  it('handles malformed and edge case URLs', () => {
    expect(extractServerFromPath('https://')).toBeNull()
    expect(extractServerFromPath('///')).toBeNull()
    expect(extractServerFromPath('https://api example.com')).toBeNull()
    expect(extractServerFromPath('https://api<>.example.com')).toBeNull()
    expect(extractServerFromPath('/api/v1/users')).toBeNull()
  })

  it('handles URLs with complex paths and query parameters', () => {
    expect(extractServerFromPath('https://api.example.com/v1/users/123/posts/456')).toEqual([
      'https://api.example.com',
      '/v1/users/123/posts/456',
    ])
    expect(extractServerFromPath('https://api.example.com/search?q=test&page=1&limit=10')).toEqual([
      'https://api.example.com',
      '/search?q=test&page=1&limit=10',
    ])
    expect(extractServerFromPath('https://api.example.com/users/{userId}/posts/{postId}')).toEqual([
      'https://api.example.com',
      '/users/{userId}/posts/{postId}',
    ])
  })

  it('handles OpenAPI server URL variables', () => {
    expect(extractServerFromPath('https://{environment}.example.com')).toEqual([
      'https://{environment}.example.com',
      '/',
    ])
    expect(extractServerFromPath('https://{subdomain}.{domain}.com')).toEqual(['https://{subdomain}.{domain}.com', '/'])
    expect(extractServerFromPath('https://api.example.com/{version}/users')).toEqual([
      'https://api.example.com',
      '/{version}/users',
    ])
  })

  it('normalizes protocol case and preserves protocol differences', () => {
    expect(extractServerFromPath('HTTPS://api.example.com')).toEqual(['https://api.example.com', '/'])
    expect(extractServerFromPath('HtTpS://api.example.com')).toEqual(['https://api.example.com', '/'])
    const [https] = extractServerFromPath('https://api.example.com/path')!
    const [http] = extractServerFromPath('http://api.example.com/path')!
    expect(https).not.toBe(http)
  })

  it('extracts consistent server from multiple endpoints', () => {
    const endpoints = [
      'https://api.example.com/users',
      'https://api.example.com/posts',
      'https://api.example.com/comments',
    ]
    const servers = endpoints.map((s) => extractServerFromPath(s)?.[0])
    expect(new Set(servers).size).toBe(1)
    expect(servers[0]).toBe('https://api.example.com')
  })

  it('distinguishes between different environments', () => {
    const [prod] = extractServerFromPath('https://api.example.com/users')!
    const [staging] = extractServerFromPath('https://api.staging.example.com/users')!
    const [dev] = extractServerFromPath('https://api.dev.example.com/users')!

    expect(prod).toBe('https://api.example.com')
    expect(staging).toBe('https://api.staging.example.com')
    expect(dev).toBe('https://api.dev.example.com')
    expect(prod).not.toBe(staging)
    expect(staging).not.toBe(dev)
  })

  it('handles URLs with fragments and preserves query parameters', () => {
    expect(extractServerFromPath('https://api.example.com/docs#introduction')).toEqual([
      'https://api.example.com',
      '/docs#introduction',
    ])
    expect(extractServerFromPath('https://api.example.com/docs?version=v2#section')).toEqual([
      'https://api.example.com',
      '/docs?version=v2#section',
    ])
  })

  it('handles extremely long URLs', () => {
    const longPath = '/path'.repeat(10)
    expect(extractServerFromPath(`https://api.example.com${longPath}`)).toEqual(['https://api.example.com', longPath])
  })

  it('extracts bare-hostname URLs when :// appears in the query string, path, or fragment', () => {
    expect(extractServerFromPath('api.example.com/auth?redirect=https://app.com/cb')).toEqual([
      'api.example.com',
      '/auth?redirect=https://app.com/cb',
    ])
    expect(extractServerFromPath('api.example.com/redirect?url=ftp://files.example.com/file')).toEqual([
      'api.example.com',
      '/redirect?url=ftp://files.example.com/file',
    ])
    expect(extractServerFromPath('api.example.com/docs#section://example')).toEqual([
      'api.example.com',
      '/docs#section://example',
    ])
  })

  it('preserves explicit port for bare-hostname URLs regardless of the port number', () => {
    /** Port 443 must be preserved even though it is the default for https */
    expect(extractServerFromPath('api.example.com:443/v1')).toEqual(['api.example.com:443', '/v1'])
    expect(extractServerFromPath('api.example.com:443')).toEqual(['api.example.com:443', '/'])
    /** Port 80 stays preserved (regression check for the existing behavior) */
    expect(extractServerFromPath('api.example.com:80/v1')).toEqual(['api.example.com:80', '/v1'])
    expect(extractServerFromPath('api.example.com:80')).toEqual(['api.example.com:80', '/'])
    /** Non-default ports continue to round-trip */
    expect(extractServerFromPath('api.example.com:8443/v1')).toEqual(['api.example.com:8443', '/v1'])
  })
})
