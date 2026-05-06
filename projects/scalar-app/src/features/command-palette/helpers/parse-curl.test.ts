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

    it('parses curl command with only method flag', () => {
      const curlCommand = 'curl -X POST'
      const result = parseCurlCommand(curlCommand)
      expect(result.method).toBe('post')
      expect(result.url).toBe('')
    })

    it('parses curl command with only header flag', () => {
      const curlCommand = 'curl -H "Content-Type: application/json"'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
      })
    })

    it('handles URLs with spaces correctly', () => {
      const curlCommand = 'curl "http://example.com/path with spaces"'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path%20with%20spaces')
    })

    it('handles URLs with different quote types', () => {
      const curlCommand = `curl 'http://example.com/single' "http://example.com/double"`
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/single')
    })

    it('handles URLs with special characters', () => {
      const curlCommand = 'curl "http://example.com/path?key=value&special=!@$%^*()"'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path')
      expect(result.queryParameters).toStrictEqual([
        { key: 'key', value: 'value' },
        { key: 'special', value: '!@$%^*()' },
      ])
    })

    it('handles URLs with unicode characters', () => {
      const curlCommand = 'curl "http://example.com/path/🚀/test"'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path/%F0%9F%9A%80/test')
    })

    it('handles URLs with escaped quotes', () => {
      const curlCommand = 'curl "http://example.com/path/\\"quoted\\"/test"'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path/quoted/test')
    })

    it('handles URLs with multiple consecutive spaces', () => {
      const curlCommand = 'curl "http://example.com/path    with    spaces"'
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path%20%20%20%20with%20%20%20%20spaces')
    })

    it('handles URLs with line breaks', () => {
      const curlCommand = `curl 'http://example.com/path\
?param=value'`
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('http://example.com/path')
      expect(result.queryParameters).toStrictEqual([{ key: 'param', value: 'value' }])
    })
  })

  describe('method', () => {
    it('parses the method correctly', () => {
      const curlCommand = 'curl -X POST http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.method).toBe('post')
    })

    it('parses method with --request flag correctly', () => {
      const curlCommand = 'curl --request GET http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.method).toBe('get')
    })
  })

  describe('body', () => {
    it('parses body data correctly', () => {
      const curlCommand = 'curl -d "name=example" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('name=example')
    })

    it('parses body data from file correctly', () => {
      const curlCommand = 'curl -d @file.txt http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('')
    })

    it('parses body data with --data flag correctly', () => {
      const curlCommand = 'curl --data "name=example" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('name=example')
    })

    it('parses body data from file with --data flag correctly', () => {
      const curlCommand = 'curl --data @file.txt http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('')
    })
  })

  describe('query parameters', () => {
    it('parses query parameters correctly', () => {
      const curlCommand = 'curl http://example.com?name=example'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'example' }])
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
      const curlCommand = 'curl -G -d "name=value1" -d "age=value2" http://httpbin.org/get'
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
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'value1' }])
    })

    it('parses empty query parameters gracefully', () => {
      const curlCommand = 'curl "http://example.com?name=example&age"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'example' },
        { key: 'age', value: '' },
      ])
    })

    it('handles query parameters with special characters correctly', () => {
      const curlCommand = 'curl "http://example.com?name=hello%20world&email=test%40example.com"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'hello world' },
        { key: 'email', value: 'test@example.com' },
      ])
    })

    it('handles query parameter arrays correctly', () => {
      const curlCommand = 'curl "http://example.com?ids[]=1&ids[]=2&ids[]=3"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'ids[]', value: '1' },
        { key: 'ids[]', value: '2' },
        { key: 'ids[]', value: '3' },
      ])
    })

    it('handles deeply nested query parameters correctly', () => {
      const curlCommand = 'curl "http://example.com?filter[name][first]=John&filter[name][last]=Doe"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'filter[name][first]', value: 'John' },
        { key: 'filter[name][last]', value: 'Doe' },
      ])
    })

    it('handles query parameters with symbols correctly', () => {
      const curlCommand = 'curl "http://example.com?range=>10&price=\\$100&discount=20%"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'range', value: '>10' },
        { key: 'price', value: '$100' },
        { key: 'discount', value: '20%' },
      ])
    })

    it('handles duplicate query parameter names correctly', () => {
      const curlCommand = 'curl "http://example.com?tag=red&tag=blue&tag=green"'
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([
        { key: 'tag', value: 'red' },
        { key: 'tag', value: 'blue' },
        { key: 'tag', value: 'green' },
      ])
    })

    it('handles extremely long query parameter values correctly', () => {
      const longValue = 'a'.repeat(2000)
      const curlCommand = `curl "http://example.com?data=${longValue}"`
      const result = parseCurlCommand(curlCommand)
      expect(result.queryParameters).toStrictEqual([{ key: 'data', value: longValue }])
    })
  })

  describe('headers', () => {
    it('parses headers correctly', () => {
      const curlCommand = 'curl -H "Content-Type: application/json" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
      })
    })

    it('parses multiple headers correctly', () => {
      const curlCommand = 'curl -H "Content-Type: application/json" -H "Accept: */*" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
        'Accept': '*/*',
      })
    })

    it('handles headers with special characters correctly', () => {
      const curlCommand = 'curl -H "X-Custom-Header: value!@#$%^&*()" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'X-Custom-Header': 'value!@#$%^&*()',
      })
    })

    it('handles headers with spaces in names correctly', () => {
      const curlCommand = 'curl -H "X Custom Header: value" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'X Custom Header': 'value',
      })
    })

    it('handles headers with colons in values correctly', () => {
      const curlCommand = 'curl -H "Custom-Time: 10:30:15" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Custom-Time': '10:30:15',
      })
    })

    it('handles headers with empty values correctly', () => {
      const curlCommand = 'curl -H "X-Empty:" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'X-Empty': '',
      })
    })

    it('handles headers with unicode characters correctly', () => {
      const curlCommand = 'curl -H "X-Emoji: 🚀" -H "X-Unicode: 你好" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'X-Emoji': '🚀',
        'X-Unicode': '你好',
      })
    })

    it('handles headers with quoted values correctly', () => {
      const curlCommand = 'curl -H \'Content-Type: "quoted value"\' http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': '"quoted value"',
      })
    })

    it('handles headers with backslashes correctly', () => {
      const curlCommand = 'curl -H "Path: C:\\Windows\\System32" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        Path: 'C:\\Windows\\System32',
      })
    })

    it('handles extremely long header values correctly', () => {
      const longValue = 'a'.repeat(4096)
      const curlCommand = `curl -H "X-Long: ${longValue}" http://example.com`
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'X-Long': longValue,
      })
    })

    it('parses headers with --header flag correctly', () => {
      const curlCommand = 'curl --header "Content-Type: application/json" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
      })
    })

    it('parses multiple headers with --header flag correctly', () => {
      const curlCommand = 'curl --header "Content-Type: application/json" --header "Accept: */*" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toStrictEqual({
        'Content-Type': 'application/json',
        'Accept': '*/*',
      })
    })
  })

  describe('authentication', () => {
    it('parses authentication correctly', () => {
      const curlCommand = 'curl -u user:password http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Authorization')
    })

    it('handles basic auth with special characters correctly', () => {
      const curlCommand = 'curl -u "user@domain.com:p@ssw#rd123" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers?.Authorization).toMatch(/^Basic /)
    })

    it('handles basic auth with empty password correctly', () => {
      const curlCommand = 'curl -u "user:" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers?.Authorization).toMatch(/^Basic /)
    })

    it('handles bearer token authentication correctly', () => {
      const curlCommand = 'curl -H "Authorization: Bearer abc123" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers?.Authorization).toBe('Bearer abc123')
    })

    it('handles multiple authentication methods correctly', () => {
      const curlCommand = 'curl -u user:pass -H "Authorization: Bearer token" http://example.com'
      const result = parseCurlCommand(curlCommand)
      // The last one should take precedence
      expect(result.headers?.Authorization).toBe('Bearer token')
    })

    it('handles authentication with quotes in credentials correctly', () => {
      const curlCommand = 'curl -u \'user:"p@ss"word\' http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers?.Authorization).toMatch(/^Basic /)
    })

    it('handles extremely long credentials correctly', () => {
      const longUsername = 'a'.repeat(1000)
      const longPassword = 'b'.repeat(1000)
      const curlCommand = `curl -u "${longUsername}:${longPassword}" http://example.com`
      const result = parseCurlCommand(curlCommand)
      expect(result.headers?.Authorization).toMatch(/^Basic /)
    })
  })

  describe('cookies', () => {
    it('parses cookies correctly', () => {
      const curlCommand = 'curl -b "name=value" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name=value')
    })

    it('handles multiple cookies correctly', () => {
      const curlCommand = 'curl -b "name1=value1; name2=value2" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name1=value1; name2=value2')
    })

    it('handles cookies with special characters correctly', () => {
      const curlCommand = 'curl -b "name=value with spaces; special@cookie=!@#$%" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name=value with spaces; special@cookie=!@#$%')
    })

    it('handles cookies with equals signs in value correctly', () => {
      const curlCommand = 'curl -b "token=abc=123=xyz" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'token=abc=123=xyz')
    })

    it('handles empty cookie values correctly', () => {
      const curlCommand = 'curl -b "empty=; name=value" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'empty=; name=value')
    })

    it('handles quoted cookie values correctly', () => {
      const curlCommand = 'curl -b \'session="j:{\\"user\\":\\"123\\"}";\' http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'session="j:{\\"user\\":\\"123\\"}"')
    })

    it('handles cookies with unicode characters correctly', () => {
      const curlCommand = 'curl -b "名称=值; cookie2=value2" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', '名称=值; cookie2=value2')
    })

    it('handles extremely long cookie strings correctly', () => {
      const longValue = 'x'.repeat(4096)
      const curlCommand = `curl -b "name=${longValue}" http://example.com`
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', `name=${longValue}`)
    })

    it('handles multiple cookie parameters correctly', () => {
      const curlCommand = 'curl -b "name1=value1" -b "name2=value2" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name1=value1; name2=value2')
    })

    it('parses cookies with --cookie flag correctly', () => {
      const curlCommand = 'curl --cookie "name=value" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name=value')
    })

    it('handles multiple cookies with --cookie flag correctly', () => {
      const curlCommand = 'curl --cookie "name1=value1; name2=value2" http://example.com'
      const result = parseCurlCommand(curlCommand)
      expect(result.headers).toHaveProperty('Cookie', 'name1=value1; name2=value2')
    })
  })
})
