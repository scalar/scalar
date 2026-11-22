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

    it('leaves the method unset without data or a method flag', () => {
      const result = parseCurlCommand('curl http://example.com')
      expect(result.method).toBeUndefined()
    })

    it.each(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode'])(
      'infers POST from %s without a method flag',
      (flag) => {
        const result = parseCurlCommand(`curl ${flag} 'name=example' http://example.com`)
        expect(result.method).toBe('post')
      },
    )

    it.each(['-d', '--data', '--data-binary', '--data-ascii'])('treats the @ of %s as a file', (flag) => {
      const result = parseCurlCommand(`curl ${flag} '@mention hi' http://example.com`)
      expect(result.body).toBe('')
    })

    it('sends the @ of --data-raw as it is', () => {
      const result = parseCurlCommand(`curl --data-raw '@mention hi' http://example.com`)
      expect(result.body).toBe('@mention hi')
      expect(result.method).toBe('post')
    })

    it('infers POST from data that is read from a file', () => {
      const result = parseCurlCommand('curl -d @file.txt http://example.com')
      expect(result.method).toBe('post')
    })

    it.each([
      ['-X PUT', 'put'],
      ['-X GET', 'get'],
      ['--request PATCH', 'patch'],
      ['-X DELETE', 'delete'],
    ])('keeps the explicit method from %s when data is sent', (methodFlag, method) => {
      const result = parseCurlCommand(`curl ${methodFlag} -d 'name=example' http://example.com`)
      expect(result.method).toBe(method)
    })

    it('keeps the explicit method when the method flag comes after the data', () => {
      const result = parseCurlCommand("curl -d 'name=example' http://example.com -X PUT")
      expect(result.method).toBe('put')
    })

    it.each(['-G', '--get'])('does not infer POST from data sent with %s', (flag) => {
      const result = parseCurlCommand(`curl ${flag} -d 'name=example' http://example.com`)
      expect(result.method).toBeUndefined()
    })

    it('imports the Chrome copy as cURL output of a POST request', () => {
      const result = parseCurlCommand(`curl 'https://api.example.com/v1/users' \\
  -H 'accept: application/json' \\
  -H 'content-type: application/json' \\
  --data-raw '{"name":"Ada"}'`)

      expect(result).toStrictEqual({
        url: 'https://api.example.com/v1/users',
        servers: ['https://api.example.com'],
        path: '/v1/users',
        queryParameters: [],
        headers: { accept: 'application/json', 'content-type': 'application/json' },
        body: '{"name":"Ada"}',
        method: 'post',
      })
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

    it.each([
      [
        'before the URL',
        `curl -X POST -H 'Content-Type: application/json' -d '{"name":"Ada"}' https://example.com/users`,
      ],
      [
        'after the URL',
        `curl https://example.com/users -X POST -H 'Content-Type: application/json' -d '{"name":"Ada"}'`,
      ],
      ['after --url', `curl --url https://example.com/users -d '{"name":"Ada"}' -X POST`],
    ])('keeps JSON body data out of the query when the data comes %s', (_, curlCommand) => {
      const result = parseCurlCommand(curlCommand)
      expect(result.body).toBe('{"name":"Ada"}')
      expect(result.queryParameters).toStrictEqual([])
    })

    it.each(['-d', '--data', '--data-raw', '--data-binary', '--data-ascii'])(
      'keeps form body data out of the query for %s before the URL',
      (flag) => {
        const result = parseCurlCommand(`curl -X POST ${flag} 'user=ada&pass=x' https://example.com/login`)
        expect(result.body).toBe('user=ada&pass=x')
        expect(result.queryParameters).toStrictEqual([])
      },
    )

    it('joins repeated data flags with an ampersand like curl', () => {
      const result = parseCurlCommand(
        "curl -d 'name=value1' --data-raw 'age=value2' -d 'city=value3' http://example.com",
      )
      expect(result.body).toBe('name=value1&age=value2&city=value3')
    })

    it('keeps the separator for mocked empty file data when joining repeated data flags', () => {
      const result = parseCurlCommand("curl -d 'name=value1' -d @file.txt -d 'age=value2' http://example.com")
      expect(result.body).toBe('name=value1&&age=value2')
    })

    it.each([
      ['a header value', `curl -H 'X-Tag: v1-Gold' -d '{"a":1}' https://example.com/x`],
      ['a header name', `curl -H 'X-API-Gateway: 1' https://example.com/x -d '{"a":1}'`],
      ['a path segment', `curl -d '{"a":1}' https://example.com/-G/x`],
      ['the body', `curl -d '{"a":1,"flag":"-G"}' https://example.com/x`],
      ['a header that is only the flag', `curl -H '-G' -d '{"a":1}' https://example.com/x`],
      ['a data value that is only the flag', 'curl -d -G https://example.com/x'],
    ])('ignores -G text inside %s', (_, curlCommand) => {
      const result = parseCurlCommand(curlCommand)
      expect(result.method).toBe('post')
      expect(result.queryParameters).toStrictEqual([])
    })

    it.each(['-G', '--get'])('keeps data out of the body with %s', (flag) => {
      const result = parseCurlCommand(`curl ${flag} -d 'name=value1' http://example.com`)
      expect(result.body).toBeUndefined()
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

    it.each(['-G', '--get'])('parses query parameters from data with %s after the URL', (flag) => {
      const result = parseCurlCommand(`curl -d 'name=value1&age=value2' https://example.com ${flag}`)
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
        { key: 'age', value: 'value2' },
      ])
    })

    it('appends the data of -G after the query parameters of the URL', () => {
      const result = parseCurlCommand("curl -G -d 'age=value2' 'https://example.com/users?name=value1'")
      expect(result.queryParameters).toStrictEqual([
        { key: 'name', value: 'value1' },
        { key: 'age', value: 'value2' },
      ])
    })

    it('does not parse query parameters from the body without -G', () => {
      const result = parseCurlCommand("curl -d 'name=value1&age=value2' https://example.com")
      expect(result.queryParameters).toStrictEqual([])
      expect(result.body).toBe('name=value1&age=value2')
    })

    it('ignores data read from a file with -G', () => {
      const result = parseCurlCommand('curl -G -d @file.txt https://example.com')
      expect(result.queryParameters).toStrictEqual([])
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

  it.each([
    '-A',
    '-sA',
    '-c',
    '-sLc',
    '-C',
    '-D',
    '-e',
    '-E',
    '-K',
    '-m',
    '-o',
    '-sSo',
    '-Q',
    '-r',
    '-t',
    '-T',
    '-U',
    '-w',
    '-x',
    '-y',
    '-Y',
    '-z',
    '--user-agent',
    '--cookie-jar',
    '--continue-at',
    '--dump-header',
    '--referer',
    '--cert',
    '--config',
    '--max-time',
    '--output',
    '--quote',
    '--range',
    '--telnet-option',
    '--upload-file',
    '--proxy-user',
    '--write-out',
    '--proxy',
    '--speed-time',
    '--speed-limit',
    '--time-cond',
    '--connect-timeout',
    '--cacert',
  ])('consumes the ignored option %s before reading the next flag', (option) => {
    const result = parseCurlCommand(`curl ${option} '-XPOST' https://example.com`)
    expect(result).toStrictEqual({
      url: 'https://example.com',
      servers: ['https://example.com'],
      path: '',
      queryParameters: [],
    })
  })

  it.each([
    `-A '-G'`,
    `-sA '-G'`,
    '-A-G',
    '-sA-G',
    `--user-agent '-G'`,
    '--user-agent=-G',
    `-o '--json'`,
    `-sSo '--json'`,
    '-o--json',
    `--output '--json'`,
    '--output=--json',
    `-x 'https://proxy.example.com'`,
    '-sLxhttps://proxy.example.com',
    `--proxy 'https://proxy.example.com'`,
    '--proxy=https://proxy.example.com',
    `--proxy-header 'Content-Type: text/plain'`,
  ])('keeps ignored values out of request data, headers and URL for %s', (options) => {
    const result = parseCurlCommand(`curl ${options} -d name=Ada https://example.com/users`)
    expect(result).toStrictEqual({
      url: 'https://example.com/users',
      servers: ['https://example.com'],
      path: '/users',
      queryParameters: [],
      method: 'post',
      body: 'name=Ada',
    })
  })

  it.each([`-A ''`, `-sA ''`, `--user-agent ''`, '--user-agent=', `-o ''`, `-sSo ''`, '--output='])(
    'consumes exactly one empty ignored value for %s',
    (options) => {
      const result = parseCurlCommand(`curl ${options} -X PUT https://example.com`)
      expect(result.method).toBe('put')
      expect(result.url).toBe('https://example.com')
    },
  )

  it.each(['-AG', '-sSoG', '--user-agent=G', '--output=G'])(
    'preserves the flag after the attached ignored value %s',
    (options) => {
      const result = parseCurlCommand(`curl ${options} -G -d name=Ada https://example.com`)
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'Ada' }])
      expect(result.body).toBeUndefined()
      expect(result.method).toBeUndefined()
    },
  )

  it.each([
    [`-d a -d '' -d b`, 'a&&b'],
    ['-d a --data=', 'a&'],
    [`-d a -d '' -d ''`, 'a&&'],
    [`-d '' -d a`, 'a'],
    [`--json a -d '' --json b`, 'a&b'],
    [`-d a --json '' -d b`, 'a&b'],
  ])('keeps curl data separators for %s', (options, body) => {
    const result = parseCurlCommand(`curl ${options} https://example.com`)
    expect(result.body).toBe(body)
    expect(result.method).toBe('post')
  })

  describe('short flags', () => {
    it.each(['-sG', '-Gs', '-sSG', '-sLG', '-vG', '-sSLG'])('reads -G from the bundle %s', (bundle) => {
      const result = parseCurlCommand(`curl ${bundle} -d 'name=value1' http://example.com`)
      expect(result.method).toBeUndefined()
      expect(result.body).toBeUndefined()
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'value1' }])
    })

    it.each([
      ['-sLX POST', 'post'],
      ['-sX PUT', 'put'],
      ['-sSLXDELETE', 'delete'],
      ['-XPOST', 'post'],
      ['-XPATCH', 'patch'],
    ])('reads the method from %s', (flags, method) => {
      const result = parseCurlCommand(`curl ${flags} http://example.com`)
      expect(result.method).toBe(method)
    })

    it.each([
      ['-sdname=example', 'name=example'],
      ['-sLd name=example', 'name=example'],
      ['-dname=example', 'name=example'],
      ['-d@file.txt', ''],
      ['-sd@file.txt', ''],
    ])('reads the data from %s', (flags, body) => {
      const result = parseCurlCommand(`curl ${flags} http://example.com`)
      expect(result.body).toBe(body)
      expect(result.method).toBe('post')
    })

    it('reads attached values for the other flags with a value', () => {
      const result = parseCurlCommand(`curl -H'Accept: application/json' -uuser:pass -bname=value http://example.com`)
      expect(result.headers).toStrictEqual({
        Accept: 'application/json',
        Authorization: `Basic ${btoa('user:pass')}`,
        Cookie: 'name=value',
      })
    })

    it('keeps the method of a bundle that ends in -X when the data comes first', () => {
      const result = parseCurlCommand(`curl -d 'name=example' -sX PUT http://example.com`)
      expect(result.method).toBe('put')
    })

    it.each(['-oG', '-sSoG', '-AG'])('does not read the value attached to %s as the -G flag', (flags) => {
      const result = parseCurlCommand(`curl ${flags} http://example.com -d name=example`)
      expect(result.method).toBe('post')
      expect(result.body).toBe('name=example')
      expect(result.queryParameters).toStrictEqual([])
    })

    it.each([
      ['-d', '-sG'],
      ['--data-raw', '-XPUT'],
      ['--json', '-sG'],
    ])('does not expand the value of %s that looks like a bundle', (flag, value) => {
      const result = parseCurlCommand(`curl ${flag} '${value}' http://example.com`)
      expect(result.body).toBe(value)
      expect(result.method).toBe('post')
    })

    it.each([
      ['-xhttp://proxy.example.com:8080', 'http://proxy.example.com:8080'],
      ['-Ahttp-client/1', 'http-client/1'],
      ['-sSLohttp.out', 'http.out'],
      ['-ehttps://referrer.example.com', 'https://referrer.example.com'],
    ])('does not read the attached value of %s as the URL', (flags) => {
      const result = parseCurlCommand(`curl ${flags} https://example.com/users -d name=example`)
      expect(result.url).toBe('https://example.com/users')
      expect(result.method).toBe('post')
    })

    it('keeps the method of -X when -G sends the data in the query', () => {
      const result = parseCurlCommand(`curl -sGX POST -d 'name=value1' http://example.com`)
      expect(result.method).toBe('post')
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'value1' }])
    })

    it('does not expand the value of a header that looks like a bundle', () => {
      const result = parseCurlCommand(`curl -H '-sG: x' http://example.com`)
      expect(result.headers).toStrictEqual({ '-sG': 'x' })
      expect(result.method).toBeUndefined()
    })

    it('still reads separate short flags and long flags', () => {
      const result = parseCurlCommand('curl -s -L -X PUT --compressed --url http://example.com/a')
      expect(result.method).toBe('put')
      expect(result.url).toBe('http://example.com/a')
    })
  })

  describe('json', () => {
    it('sends --json as the body, defaults to POST and sets the JSON headers', () => {
      const result = parseCurlCommand(`curl --json '{"name":"Ada"}' https://example.com/users`)
      expect(result).toStrictEqual({
        url: 'https://example.com/users',
        servers: ['https://example.com'],
        path: '/users',
        queryParameters: [],
        headers: { 'Content-Type': 'application/json', Accept: 'application/json' },
        body: '{"name":"Ada"}',
        method: 'post',
      })
    })

    it.each([
      ['-H "content-type: application/vnd.api+json"', 'content-type', 'application/vnd.api+json', 'Accept'],
      ['-H "CONTENT-TYPE: text/plain"', 'CONTENT-TYPE', 'text/plain', 'Accept'],
      ['-H "accept: text/plain"', 'accept', 'text/plain', 'Content-Type'],
      ['-H "Accept: */*"', 'Accept', '*/*', 'Content-Type'],
    ])('keeps the header the command sets with %s', (headerFlag, name, value, addedName) => {
      const result = parseCurlCommand(`curl ${headerFlag} --json '{}' https://example.com/users`)
      expect(result.headers).toStrictEqual({ [name]: value, [addedName]: 'application/json' })
    })

    it('keeps the headers of the command when they come after --json', () => {
      const result = parseCurlCommand(
        `curl --json '{}' -H 'Content-Type: text/plain' -H 'Accept: text/plain' https://example.com/users`,
      )
      expect(result.headers).toStrictEqual({ 'Content-Type': 'text/plain', Accept: 'text/plain' })
    })

    it('keeps an explicit method with --json', () => {
      const result = parseCurlCommand(`curl -X PUT --json '{"name":"Ada"}' https://example.com/users/1`)
      expect(result.method).toBe('put')
    })

    it('infers POST from --json data that is read from a file', () => {
      const result = parseCurlCommand('curl --json @body.json https://example.com/users')
      expect(result.method).toBe('post')
      expect(result.body).toBe('')
    })

    it('joins repeated --json flags without an ampersand like curl', () => {
      const result = parseCurlCommand(`curl --json '{"name":' --json '"Ada"}' https://example.com/users`)
      expect(result.body).toBe('{"name":"Ada"}')
    })

    it('does not add the JSON headers for other data flags', () => {
      const result = parseCurlCommand(`curl -d '{"name":"Ada"}' https://example.com/users`)
      expect(result.headers).toBeUndefined()
    })

    it('does not add headers to a command without data', () => {
      const result = parseCurlCommand('curl https://example.com/users')
      expect(result.headers).toBeUndefined()
    })
  })

  describe('empty data', () => {
    it.each([
      ['-d', `curl -d '' https://example.com/users`],
      ['--data-raw', `curl --data-raw '' https://example.com/users`],
      ['--data-binary', `curl --data-binary "" https://example.com/users`],
      ['whitespace', `curl -d '   ' https://example.com/users`],
      ['-d after the URL', `curl https://example.com/users -d ''`],
      ['-d in a bundle', `curl -sd '' https://example.com/users`],
      ['--json', `curl --json '' https://example.com/users`],
    ])('keeps the URL and sends an empty POST for %s', (_, curlCommand) => {
      const result = parseCurlCommand(curlCommand)
      expect(result.url).toBe('https://example.com/users')
      expect(result.body).toBe('')
      expect(result.method).toBe('post')
    })

    it('keeps later data after an initial empty data argument', () => {
      const result = parseCurlCommand(`curl -d '' -d 'name=value1' https://example.com/users`)
      expect(result.body).toBe('name=value1')
    })

    it('adds nothing to the query for empty data with -G', () => {
      const result = parseCurlCommand(`curl -G -d '' https://example.com/users`)
      expect(result.url).toBe('https://example.com/users')
      expect(result.queryParameters).toStrictEqual([])
    })

    it('still ignores an empty argument where a flag is expected', () => {
      const result = parseCurlCommand(`curl '' -d name=value1 '' https://example.com/users`)
      expect(result.url).toBe('https://example.com/users')
      expect(result.body).toBe('name=value1')
    })
  })

  describe('attached long flag values', () => {
    it('reads every flag read from --flag=value', () => {
      const result = parseCurlCommand(
        `curl --url=https://example.com/users --request=PUT --header='X-Tag: v1' --data='{"name":"Ada"}'`,
      )
      expect(result).toStrictEqual({
        url: 'https://example.com/users',
        servers: ['https://example.com'],
        path: '/users',
        queryParameters: [],
        headers: { 'X-Tag': 'v1' },
        body: '{"name":"Ada"}',
        method: 'put',
      })
    })

    it.each(['--data', '--data-raw', '--data-binary', '--data-ascii', '--data-urlencode'])(
      'reads the data of %s=value and infers POST',
      (flag) => {
        const result = parseCurlCommand(`curl ${flag}=name=example https://example.com/users`)
        expect(result.url).toBe('https://example.com/users')
        expect(result.body).toBe('name=example')
        expect(result.method).toBe('post')
      },
    )

    it('reads --json=value as a JSON body with its headers', () => {
      const result = parseCurlCommand(`curl --json='{"name":"Ada"}' https://example.com/users`)
      expect(result.body).toBe('{"name":"Ada"}')
      expect(result.method).toBe('post')
      expect(result.headers).toStrictEqual({ 'Content-Type': 'application/json', Accept: 'application/json' })
    })

    it.each([
      ['--user=user:pass', { Authorization: `Basic ${btoa('user:pass')}` }],
      ['--cookie=name=value', { Cookie: 'name=value' }],
    ])('reads %s', (flag, headers) => {
      const result = parseCurlCommand(`curl ${flag} https://example.com/users`)
      expect(result.headers).toStrictEqual(headers)
    })

    it('keeps the equal signs of the value and a trailing empty data argument', () => {
      const result = parseCurlCommand('curl --data=a=b=c --data= https://example.com/users')
      expect(result.body).toBe('a=b=c&')
      expect(result.url).toBe('https://example.com/users')
    })

    it('keeps the explicit method of --request=value when data is sent', () => {
      const result = parseCurlCommand(`curl -d 'name=example' --request=GET https://example.com/users`)
      expect(result.method).toBe('get')
    })

    it('sends the attached data in the query with -G', () => {
      const result = parseCurlCommand('curl -G --data=name=value1 https://example.com/users')
      expect(result.method).toBeUndefined()
      expect(result.queryParameters).toStrictEqual([{ key: 'name', value: 'value1' }])
    })

    it.each([
      '--proxy=http://proxy.example.com:8080',
      '--referer=https://referrer.example.com',
      '--user-agent=http-client/1',
    ])('does not read the attached value of %s as the URL', (flag) => {
      const result = parseCurlCommand(`curl ${flag} https://example.com/users -d name=example`)
      expect(result.url).toBe('https://example.com/users')
      expect(result.method).toBe('post')
    })

    it.each([
      ['-d', '--request=PUT'],
      ['--data', '--url=https://example.com/other'],
    ])('does not expand the value of %s that looks like an attached flag', (flag, value) => {
      const result = parseCurlCommand(`curl ${flag} '${value}' https://example.com/users`)
      expect(result.body).toBe(value)
      expect(result.url).toBe('https://example.com/users')
      expect(result.method).toBe('post')
    })
  })

  describe('form', () => {
    it('sends -F fields as a multipart body, defaults to POST and sets the multipart header', () => {
      const result = parseCurlCommand(`curl -F 'name=Ada' -F 'city=Pune' https://example.com/users`)
      expect(result).toStrictEqual({
        url: 'https://example.com/users',
        servers: ['https://example.com'],
        path: '/users',
        queryParameters: [],
        headers: { 'Content-Type': 'multipart/form-data' },
        body: 'name=Ada&city=Pune',
        method: 'post',
      })
    })

    it.each([
      ['-F name=Ada'],
      ['--form name=Ada'],
      ['--form-string name=Ada'],
      ['-Fname=Ada'],
      ['-sFname=Ada'],
      ['--form=name=Ada'],
      ['--form-string=name=Ada'],
    ])('reads the field of %s', (flag) => {
      const result = parseCurlCommand(`curl ${flag} https://example.com/users`)
      expect(result.body).toBe('name=Ada')
      expect(result.method).toBe('post')
      expect(result.url).toBe('https://example.com/users')
    })

    it.each([
      ['-X PUT', 'put'],
      ['--request=PATCH', 'patch'],
      ['-XDELETE', 'delete'],
      ['-X GET', 'get'],
    ])('keeps the method of %s with a form', (flag, method) => {
      const result = parseCurlCommand(`curl ${flag} -F name=Ada https://example.com/users/1`)
      expect(result.method).toBe(method)
      expect(result.body).toBe('name=Ada')
    })

    it.each(['-G', '--get', '-sG'])('keeps a form in the body with %s', (flag) => {
      const result = parseCurlCommand(`curl ${flag} -F name=Ada https://example.com/users`)
      expect(result.method).toBe('post')
      expect(result.body).toBe('name=Ada')
      expect(result.queryParameters).toStrictEqual([])
    })

    it('moves the data of -G to the query string while a form stays in the body', () => {
      const result = parseCurlCommand(`curl -G -d 'page=2' -F name=Ada https://example.com/users`)
      expect(result.method).toBe('post')
      expect(result.body).toBe('name=Ada')
      expect(result.queryParameters).toStrictEqual([{ key: 'page', value: '2' }])
    })

    it.each([
      ['name=Ada;type=text/plain', 'name=Ada'],
      ['name=Ada;filename=ada.txt;type=text/plain', 'name=Ada'],
      ['name=Ada;', 'name=Ada'],
      ['name=a=b', 'name=a%3Db'],
      ['name=a&b', 'name=a%26b'],
      ['name=', 'name='],
      ['name="a;b"', 'name=a%3Bb'],
      ['name="a;type=b"', 'name=a%3Btype%3Db'],
      [String.raw`name="a\"b\\c"`, 'name=a%22b%5Cc'],
      ['name="@file.txt"', 'name=%40file.txt'],
      ['name=@file.txt', 'name='],
      ['name=<file.txt', 'name='],
      ['name=@file.txt;type=text/plain', 'name='],
      ['a&b=c', 'a%26b=c'],
      ['name=é 日本語 😀 שלום', 'name=%C3%A9%20%E6%97%A5%E6%9C%AC%E8%AA%9E%20%F0%9F%98%80%20%D7%A9%D7%9C%D7%95%D7%9D'],
      ['日本語=Ada', '%E6%97%A5%E6%9C%AC%E8%AA%9E=Ada'],
    ])('reads the field %s like curl', (field, body) => {
      const result = parseCurlCommand(`curl -F '${field}' https://example.com/users`)
      expect(result.body).toBe(body)
    })

    it.each([
      ['name=Ada;type=text/plain', 'name=Ada%3Btype%3Dtext%2Fplain'],
      ['name="Ada"', 'name=%22Ada%22'],
      ['name=@file.txt', 'name=%40file.txt'],
      ['name=<file.txt', 'name=%3Cfile.txt'],
    ])('reads the field %s of --form-string as it is', (field, body) => {
      const result = parseCurlCommand(`curl --form-string '${field}' https://example.com/users`)
      expect(result.body).toBe(body)
    })

    it('keeps the order and the repeated names of the fields', () => {
      const result = parseCurlCommand('curl -F tag=a -F other=b -F tag=c -F tag= https://example.com/users')
      expect(result.body).toBe('tag=a&other=b&tag=c&tag=')
    })

    it('skips a field without an equal sign', () => {
      const result = parseCurlCommand('curl -F name -F city=Pune https://example.com/users')
      expect(result.body).toBe('city=Pune')
      expect(result.method).toBe('post')
    })

    it.each([
      ['-H "Content-Type: multipart/mixed"', 'Content-Type', 'multipart/mixed'],
      ['-H "content-type: multipart/related"', 'content-type', 'multipart/related'],
      ['-H "CONTENT-TYPE: text/plain"', 'CONTENT-TYPE', 'text/plain'],
    ])('keeps the header the command sets with %s', (headerFlag, name, value) => {
      const result = parseCurlCommand(`curl ${headerFlag} -F name=Ada https://example.com/users`)
      expect(result.headers).toStrictEqual({ [name]: value })
    })

    it('keeps the other headers of the command next to the multipart header', () => {
      const result = parseCurlCommand(`curl -F name=Ada -H 'Accept: */*' https://example.com/users`)
      expect(result.headers).toStrictEqual({ Accept: '*/*', 'Content-Type': 'multipart/form-data' })
    })

    it('does not read the value of a form flag as the URL', () => {
      const result = parseCurlCommand(`curl -F 'www.example.org=1' https://example.com/users`)
      expect(result.url).toBe('https://example.com/users')
    })

    it('reads a form before the URL as the body', () => {
      const result = parseCurlCommand('curl -F name=Ada -X POST https://example.com/users -F city=Pune')
      expect(result.body).toBe('name=Ada&city=Pune')
      expect(result.queryParameters).toStrictEqual([])
    })

    it('does not add the multipart header to a command without a form', () => {
      const result = parseCurlCommand(`curl -d 'name=Ada' https://example.com/users`)
      expect(result.headers).toBeUndefined()
    })
  })

  describe('ANSI-C quoting', () => {
    it.each([
      ['Chrome with an apostrophe', String.raw`$'{"name":"it\'s"}'`, `{"name":"it's"}`],
      [
        'Chrome with a newline, a tab and an exclamation mark',
        String.raw`$'line1\nline2\u0009end\u0021'`,
        'line1\nline2\tend!',
      ],
      [
        'Chrome with backslashes, a percent sign and an ampersand',
        String.raw`$'{"a":"x\\ny\\\\z","t":"100% & more\u0021"}'`,
        String.raw`{"a":"x\ny\\z","t":"100% & more!"}`,
      ],
      [
        'Chrome with an apostrophe and multilingual text',
        String.raw`$'{"n":"it\'s café 日本語 😀 שלום"}'`,
        `{"n":"it's café 日本語 😀 שלום"}`,
      ],
      ['Chrome with multilingual text', String.raw`'{"n":"café 日本語 😀 שלום"}'`, `{"n":"café 日本語 😀 שלום"}`],
      ['Firefox with an exclamation mark', String.raw`$'{"t":"more\041"}'`, '{"t":"more!"}'],
      ['Firefox with a newline and a tab', String.raw`$'line1\nline2\x09end'`, 'line1\nline2\tend'],
      ['Firefox with multilingual text', String.raw`$'{"n":"caf\xe9 日本語 😀 שלום"}'`, `{"n":"café 日本語 😀 שלום"}`],
      ['Postman and Insomnia with an apostrophe', String.raw`'{"name":"it'\''s"}'`, `{"name":"it's"}`],
    ])('reads the body copied from %s', (_name, argument, body) => {
      const result = parseCurlCommand(`curl https://example.com/users --data-raw ${argument}`)
      expect(result.body).toBe(body)
      expect(result.method).toBe('post')
    })

    it('reads the method, headers and cookies that are ANSI-C quoted', () => {
      const result = parseCurlCommand(
        String.raw`curl --url 'https://example.com/users' -X $'PUT' -H $'X-Note: it\'s fine\u0021' -b $'session=it\'s'`,
      )
      expect(result.method).toBe('put')
      expect(result.headers).toStrictEqual({ 'X-Note': "it's fine!", Cookie: "session=it's" })
    })

    it('keeps a dollar sign and an apostrophe that are not ANSI-C quotes', () => {
      const result = parseCurlCommand(String.raw`curl https://example.com/users -d "price: $'5"`)
      expect(result.body).toBe("price: $'5")
    })
  })

  describe('Windows cmd quoting', () => {
    const copyCommand = (dataArgument: string): string =>
      [
        'curl --url ^"https://example.com/users^" ^',
        '  -H ^"Content-Type: application/json^" ^',
        `  --data-raw ${dataArgument}`,
      ].join('\n')

    it.each([
      ['Chrome with an apostrophe', `^"^{^"^"name^"^":^"^"it's^"^"^}^"`, `{"name":"it's"}`],
      ['older Chrome with an apostrophe', String.raw`^"^{^\^"name^\^":^\^"it's^\^"^}^"`, `{"name":"it's"}`],
      [
        'Chrome with backslashes, a percent sign, an ampersand and an exclamation mark',
        String.raw`^"^{^"^"a^"^":^"^"x^\^\ny^\^\^\^\z^"^",^"^"t^"^":^"^"100^% ^& more^!^"^"^}^"`,
        String.raw`{"a":"x\ny\\z","t":"100% & more!"}`,
      ],
      [
        'older Chrome with backslashes, a percent sign, an ampersand and an exclamation mark',
        String.raw`^"^{^\^"a^\^":^\^"x^\^\ny^\^\^\^\z^\^",^\^"t^\^":^\^"100^% ^& more^!^\^"^}^"`,
        String.raw`{"a":"x\ny\\z","t":"100% & more!"}`,
      ],
      ['Chrome with a newline and a tab', '^"line1^\n\nline2 end^"', 'line1\nline2 end'],
      [
        'Chrome with escaped quotes',
        String.raw`^"^{^"^"q^"^":^"^"say ^\^\^"^"hi^\^\^"^"^"^"^}^"`,
        String.raw`{"q":"say \"hi\""}`,
      ],
      [
        'older Chrome with escaped quotes',
        String.raw`^"^{^\^"q^\^":^\^"say ^\^\^\^"hi^\^\^\^"^\^"^}^"`,
        String.raw`{"q":"say \"hi\""}`,
      ],
      [
        'Chrome with special characters',
        '^"a^^b ^& c ^| d ^< e ^> f ^( g ^) ^`h^` 100^%^PATH^% ^$x^"',
        'a^b & c | d < e > f ( g ) `h` 100%PATH% $x',
      ],
      [
        'Firefox with special characters',
        '^"a^^b ^& c ^| d ^< e ^> f ( g ) `h` 100^%^PATH^% ^$x^"',
        'a^b & c | d < e > f ( g ) `h` 100%PATH% $x',
      ],
      [
        'Firefox with multilingual text',
        String.raw`^"^{^\^"n^\^":^\^"caf^é ^日^本^語 ^😀 ^ש^ל^ו^ם^\^"^}^"`,
        `{"n":"café 日本語 😀 שלום"}`,
      ],
      [
        'Chrome with multilingual text, which it writes as spaces',
        '^"^{^"^"n^"^":^"^"caf^  ^ ^ ^  ^ ^  ^ ^ ^ ^ ^"^"^}^"',
        `{"n":"caf${' '.repeat(13)}"}`,
      ],
    ])('reads the body copied from %s', (_name, argument, body) => {
      const result = parseCurlCommand(copyCommand(argument))
      expect(result.body).toBe(body)
      expect(result.method).toBe('post')
    })

    it('reads a complete command copied from Chrome', () => {
      const result = parseCurlCommand(
        [
          'curl --url ^"https://example.com/users/1?id=1^&x=2^" ^',
          '  -X ^"PUT^" ^',
          '  -H ^"Accept: */*^" ^',
          '  -b ^"a=b; c=d^" ^',
          '  --data-raw ^"name=Ada^&city=Pune^"',
        ].join('\n'),
      )
      expect(result).toStrictEqual({
        url: 'https://example.com/users/1',
        servers: ['https://example.com'],
        path: '/users/1',
        queryParameters: [
          { key: 'id', value: '1' },
          { key: 'x', value: '2' },
        ],
        headers: { Accept: '*/*', Cookie: 'a=b; c=d' },
        body: 'name=Ada&city=Pune',
        method: 'put',
      })
    })

    it('reads a complete command copied from Firefox', () => {
      const result = parseCurlCommand(
        [
          'curl.exe ^"https://example.com/users^" ^',
          '  -X PUT ^',
          '  -H ^"Content-Type: application/json^" ^',
          String.raw`  --data-raw ^"^{^\^"name^\^":^\^"Ada^\^"^}^"`,
        ].join('\n'),
      )
      expect(result).toStrictEqual({
        url: 'https://example.com/users',
        servers: ['https://example.com'],
        path: '/users',
        queryParameters: [],
        headers: { 'Content-Type': 'application/json' },
        body: '{"name":"Ada"}',
        method: 'put',
      })
    })

    it('reads a command with carriage returns after the carets', () => {
      const result = parseCurlCommand(copyCommand('^"^{^"^"name^"^":^"^"Ada^"^"^}^"').replaceAll('\n', '\r\n'))
      expect(result.body).toBe('{"name":"Ada"}')
      expect(result.headers).toStrictEqual({ 'Content-Type': 'application/json' })
    })

    it('keeps a caret inside the double quotes of a command that joins its lines with carets', () => {
      const result = parseCurlCommand('curl ^\n  -d "a^b" ^\n  https://example.com/users')
      expect(result.body).toBe('a^b')
      expect(result.url).toBe('https://example.com/users')
    })

    it.each([
      [`'a^b'`, 'a^b'],
      [`'a^"b'`, 'a^"b'],
      [`'{"op":"xor^"}'`, '{"op":"xor^"}'],
      [`'a^\nb'`, 'a^\nb'],
      [`"a^b"`, 'a^b'],
      [String.raw`$'it\'s ^"'`, `it's ^"`],
      [String.raw`'it'\''s ^"'`, `it's ^"`],
    ])('does not read the caret of the POSIX body %s as cmd syntax', (argument, body) => {
      const result = parseCurlCommand(`curl https://example.com/users -d ${argument}`)
      expect(result.body).toBe(body)
    })

    it('reads a command that escapes its quotes with backslashes', () => {
      const result = parseCurlCommand(String.raw`curl -X POST "https://example.com/users" -d "{\"name\":\"Ada\"}"`)
      expect(result.body).toBe('{"name":"Ada"}')
      expect(result.url).toBe('https://example.com/users')
    })
  })

  describe('data-urlencode', () => {
    it.each([
      ['q=a&b c', 'q=a%26b%20c'],
      ['a&b', 'a%26b'],
      ['=a&b', 'a%26b'],
      ['q=1=2', 'q=1%3D2'],
      ['q=', 'q='],
      ['q@file.txt', 'q='],
      ['@file.txt', ''],
      ['name=é', 'name=%C3%A9'],
    ])('percent-encodes the content of %s like curl', (argument, body) => {
      const result = parseCurlCommand(`curl --data-urlencode '${argument}' https://example.com/users`)
      expect(result.body).toBe(body)
      expect(result.method).toBe('post')
    })

    it('joins encoded content with other data using an ampersand', () => {
      const result = parseCurlCommand(`curl --data-urlencode 'q=a&b' -d 'limit=10' https://example.com/users`)
      expect(result.body).toBe('q=a%26b&limit=10')
    })

    it('keeps an encoded & inside its value with -G', () => {
      const result = parseCurlCommand(`curl -G --data-urlencode 'q=a&b c' https://example.com/search`)
      expect(result.queryParameters).toStrictEqual([{ key: 'q', value: 'a&b c' }])
    })

    it('does not encode the other data flags', () => {
      const result = parseCurlCommand(`curl -d 'q=a&b c' https://example.com/users`)
      expect(result.body).toBe('q=a&b c')
    })
  })
})
