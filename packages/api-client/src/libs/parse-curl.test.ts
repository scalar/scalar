import { describe, expect, it } from 'vitest'

import { parseCurlCommand } from './parse-curl'

describe('parseCurlCommand', () => {
  describe('url', () => {
    it('parses the URL correctly', () => {
      const curlCommand = 'curl http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com')
    })

    it('handles URL without --url flag', () => {
      const curlCommand = 'curl http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com')
    })
  })

  describe('method', () => {
    it('parses the method correctly', () => {
      const curlCommand = 'curl -X POST http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.method).toBe('post')
    })
  })

  describe('body', () => {
    it('parses body data correctly', () => {
      const curlCommand = 'curl -d "name=example" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('name=example')
    })
  })

  describe('query parameters', () => {
    it('parses query parameters correctly', () => {
      const curlCommand = 'curl http://example.com?name=example'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'example' },
      ])
    })

    it('parses multiple query parameters from URL correctly', () => {
      const curlCommand = "curl 'http://httpbin.org/get?name=value1&age=value2'"
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
        { key: 'age', value: 'value2' },
      ])
    })

    it('parses query parameters with -G and -d flags correctly', () => {
      const curlCommand =
        'curl -G -d "name=value1" -d "age=value2" http://httpbin.org/get'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
        { key: 'age', value: 'value2' },
      ])
    })

    it('parses query parameters from body data correctly', () => {
      const curlCommand = "curl -d 'name=value1&age=value2' https://example.com"
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
        { key: 'age', value: 'value2' },
      ])
    })

    it('parses single query parameter from body data correctly', () => {
      const curlCommand = "curl --data 'name=value1' https://example.com"
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
      ])
    })
  })

  describe('headers', () => {
    it('parses headers correctly', () => {
      const curlCommand =
        'curl -H "Content-Type: application/json" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
      })
    })
  })

  describe('authentication', () => {
    it('parses authentication correctly', () => {
      const curlCommand = 'curl -u user:password http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Authorization')
    })
  })

  describe('cookies', () => {
    it('parses cookies correctly', () => {
      const curlCommand = 'curl -b "name=value" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name=value')
    })
  })
})
