import { describe, expect, it } from 'vitest'

import { extractServer } from './extract-server'

describe('extractServer', () => {
  it('returns null for empty or invalid inputs', () => {
    expect(extractServer('')).toBeNull()
    expect(extractServer(undefined)).toBeNull()
    expect(extractServer('   ')).toBeNull()
  })

  it('extracts server from basic HTTPS and HTTP URLs', () => {
    expect(extractServer('https://api.example.com')).toBe('https://api.example.com')
    expect(extractServer('http://api.example.com')).toBe('http://api.example.com')
    expect(extractServer('https://api.example.com/v1/users')).toBe('https://api.example.com')
  })

  it('returns null for URLs without protocol', () => {
    expect(extractServer('api.example.com')).toBeNull()
    expect(extractServer('api.example.com/v1/users')).toBeNull()
  })

  it('normalizes standard ports and preserves custom ports', () => {
    expect(extractServer('https://api.example.com:443')).toBe('https://api.example.com')
    expect(extractServer('http://api.example.com:80')).toBe('http://api.example.com')
    expect(extractServer('https://api.example.com:8443')).toBe('https://api.example.com:8443')
    expect(extractServer('http://localhost:3000')).toBe('http://localhost:3000')
  })

  it('extracts server from localhost and IP addresses', () => {
    expect(extractServer('http://localhost:3000/api/v1')).toBe('http://localhost:3000')
    expect(extractServer('http://192.168.1.1:8080/api')).toBe('http://192.168.1.1:8080')
    expect(extractServer('http://[2001:db8::1]:8080/api')).toBe('http://[2001:db8::1]:8080')
  })

  it('handles subdomains and complex domains', () => {
    expect(extractServer('https://api.staging.example.com/v1/users')).toBe('https://api.staging.example.com')
    expect(extractServer('https://v1.api.staging.example.com')).toBe('https://v1.api.staging.example.com')
  })

  it('strips authentication credentials from URLs', () => {
    expect(extractServer('https://user:pass@api.example.com')).toBe('https://api.example.com')
    expect(extractServer('https://user:pass@api.example.com:8443/v1/users')).toBe('https://api.example.com:8443')
  })

  it('handles protocol-relative URLs', () => {
    expect(extractServer('//api.example.com/v1/users')).toBe('//api.example.com')
    expect(extractServer('//api.example.com:8080/v1/users')).toBe('//api.example.com:8080')
    expect(extractServer('//localhost:3000')).toBe('//localhost:3000')
  })

  it('handles different URL schemes', () => {
    expect(extractServer('ws://api.example.com')).toBe('ws://api.example.com')
    expect(extractServer('wss://api.example.com')).toBe('wss://api.example.com')
    expect(extractServer('ftp://files.example.com')).toBe('ftp://files.example.com')
    expect(extractServer('file:///path/to/file')).toBeNull()
  })

  it('validates port numbers', () => {
    expect(extractServer('https://api.example.com:65535')).toBe('https://api.example.com:65535')
    expect(extractServer('https://api.example.com:99999')).toBeNull()
    expect(extractServer('https://api.example.com:-1')).toBeNull()
    expect(extractServer('https://api.example.com:abc')).toBeNull()
  })

  it('handles internationalized domains', () => {
    expect(extractServer('https://api.münchen.de')).toBe('https://api.xn--mnchen-3ya.de')
    expect(extractServer('https://api.xn--mnchen-3ya.de')).toBe('https://api.xn--mnchen-3ya.de')
  })

  it('extracts server from real-world API URLs', () => {
    expect(extractServer('https://api.github.com/repos/scalar/scalar')).toBe('https://api.github.com')
    expect(extractServer('https://abc123.execute-api.us-east-1.amazonaws.com/prod/users')).toBe(
      'https://abc123.execute-api.us-east-1.amazonaws.com',
    )
    expect(extractServer('https://my-app-abc123.vercel.app/api/data')).toBe('https://my-app-abc123.vercel.app')
  })

  it('handles malformed and edge case URLs', () => {
    expect(extractServer('https://')).toBeNull()
    expect(extractServer('///')).toBeNull()
    expect(extractServer('https://api example.com')).toBeNull()
    expect(extractServer('https://api<>.example.com')).toBeNull()
    expect(extractServer('/api/v1/users')).toBeNull()
  })

  it('handles URLs with complex paths and query parameters', () => {
    expect(extractServer('https://api.example.com/v1/users/123/posts/456')).toBe('https://api.example.com')
    expect(extractServer('https://api.example.com/search?q=test&page=1&limit=10')).toBe('https://api.example.com')
    expect(extractServer('https://api.example.com/users/{userId}/posts/{postId}')).toBe('https://api.example.com')
  })

  it('handles OpenAPI server URL variables', () => {
    expect(extractServer('https://{environment}.example.com')).toBe('https://{environment}.example.com')
    expect(extractServer('https://{subdomain}.{domain}.com')).toBe('https://{subdomain}.{domain}.com')
    expect(extractServer('https://api.example.com/{version}/users')).toBe('https://api.example.com')
  })

  it('normalizes protocol case and preserves protocol differences', () => {
    expect(extractServer('HTTPS://api.example.com')).toBe('https://api.example.com')
    expect(extractServer('HtTpS://api.example.com')).toBe('https://api.example.com')
    const https = extractServer('https://api.example.com/path')
    const http = extractServer('http://api.example.com/path')
    expect(https).not.toBe(http)
  })

  it('extracts consistent server from multiple endpoints', () => {
    const endpoints = [
      'https://api.example.com/users',
      'https://api.example.com/posts',
      'https://api.example.com/comments',
    ]
    const servers = endpoints.map(extractServer)
    expect(new Set(servers).size).toBe(1)
    expect(servers[0]).toBe('https://api.example.com')
  })

  it('distinguishes between different environments', () => {
    const prod = extractServer('https://api.example.com/users')
    const staging = extractServer('https://api.staging.example.com/users')
    const dev = extractServer('https://api.dev.example.com/users')

    expect(prod).toBe('https://api.example.com')
    expect(staging).toBe('https://api.staging.example.com')
    expect(dev).toBe('https://api.dev.example.com')
    expect(prod).not.toBe(staging)
    expect(staging).not.toBe(dev)
  })

  it('handles URLs with fragments and preserves query parameters', () => {
    expect(extractServer('https://api.example.com/docs#introduction')).toBe('https://api.example.com')
    expect(extractServer('https://api.example.com/docs?version=v2#section')).toBe('https://api.example.com')
  })

  it('handles extremely long URLs', () => {
    const longPath = '/path'.repeat(1000)
    expect(extractServer(`https://api.example.com${longPath}`)).toBe('https://api.example.com')
  })
})
