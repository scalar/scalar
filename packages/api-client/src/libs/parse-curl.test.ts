import { describe, expect, it } from 'vitest'

import { parseCurlCommand } from './parse-curl'

describe('parseCurlCommand', () => {
  it('parses the URL correctly', () => {
    const curlCommand = 'curl http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.url).toBe('http://example.com')
  })

  it('parses the method correctly', () => {
    const curlCommand = 'curl -X POST http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.method).toBe('post')
  })

  it('parses body data correctly', () => {
    const curlCommand = 'curl -d "name=example" http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.body).toBe('name=example')
  })

  it('parses query parameters correctly', () => {
    const curlCommand = 'curl http://example.com?name=example'
    const result = parseCurlCommand(curlCommand)
    expect(result.queryParameters).toStrictEqual([
      { key: 'name', value: 'example' },
    ])
  })

  it('handles URL without --url flag', () => {
    const curlCommand = 'curl http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.url).toBe('http://example.com')
  })

  it('parses headers correctly', () => {
    const curlCommand =
      'curl -H "Content-Type: application/json" http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.headers).toStrictEqual({ 'Content-Type': 'application/json' })
  })

  it('parses authentication correctly', () => {
    const curlCommand = 'curl -u user:password http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.headers).toHaveProperty('Authorization')
  })

  it('parses cookies correctly', () => {
    const curlCommand = 'curl -b "name=value" http://example.com'
    const result = parseCurlCommand(curlCommand)
    expect(result.headers).toHaveProperty('Cookie', 'name=value')
  })
})
