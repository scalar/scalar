import { describe, expect, it } from 'vitest'

import { swiftNsurlsession } from './nsurlsession'

describe('swiftNsurlsession', () => {
  it('returns an empty string for undefined request', () => {
    const result = swiftNsurlsession.generate()

    expect(result).toBe('')
  })

  it('returns a basic request', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
    })

    expect(result).toContain('import Foundation')
    expect(result).toContain('var request = URLRequest(url: URL(string: "https://example.com")!)')
    expect(result).toContain('request.httpMethod = "GET"')
    expect(result).toContain('let (data, response) = try await URLSession.shared.data(for: request)')
    expect(result).toContain('throw URLError(.badServerResponse)')
  })

  it('returns a POST request', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toContain('request.httpMethod = "POST"')
  })

  it('has headers', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
    })

    expect(result).toContain('request.setValue("application/json", forHTTPHeaderField: "Content-Type")')
  })

  it('does not add empty headers', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).not.toContain('forHTTPHeaderField:')
  })

  it('has JSON body', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toContain('let jsonBody = """')
    expect(result).toContain('  "hello": "world"')
    expect(result).toContain('request.httpBody = jsonBody.data(using: .utf8)')
  })

  it('falls back to raw JSON text when payload is invalid', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"hello":',
      },
    })

    expect(result).toContain('let jsonBody = """')
    expect(result).toContain('{"hello":')
    expect(result).toContain('request.httpBody = jsonBody.data(using: .utf8)')
  })

  it('has query string', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toContain('var request = URLRequest(url: URL(string: "https://example.com?foo=bar&bar=foo")!)')
  })

  it('has cookies', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'bar',
          value: 'foo',
        },
      ],
    })

    expect(result).toContain('request.setValue("foo=bar; bar=foo", forHTTPHeaderField: "Cookie")')
  })

  it('does not add empty cookies', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).not.toContain('forHTTPHeaderField: "Cookie"')
  })

  it('adds basic auth credentials', () => {
    const result = swiftNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toContain('let credentials = "user:pass"')
    expect(result).toContain('request.setValue("Basic \\(encodedCredentials)", forHTTPHeaderField: "Authorization")')
  })

  it('omits auth when not provided', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('encodedCredentials')
    expect(result).not.toContain('forHTTPHeaderField: "Authorization"')
  })

  it('omits auth when username is missing', () => {
    const result = swiftNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: '',
          password: 'pass',
        },
      },
    )

    expect(result).not.toContain('encodedCredentials')
    expect(result).not.toContain('forHTTPHeaderField: "Authorization"')
  })

  it('omits auth when password is missing', () => {
    const result = swiftNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user',
          password: '',
        },
      },
    )

    expect(result).not.toContain('encodedCredentials')
    expect(result).not.toContain('forHTTPHeaderField: "Authorization"')
  })

  it('handles special characters in auth credentials', () => {
    const result = swiftNsurlsession.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: {
          username: 'user@example.com',
          password: 'pass:word!',
        },
      },
    )

    expect(result).toContain('let credentials = "user@example.com:pass:word!"')
  })

  it('handles multipart form data with files', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
          },
          {
            name: 'field',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toContain('let boundary = UUID().uuidString')
    expect(result).toContain(
      'appendToBody("Content-Disposition: form-data; name=\\\\\\"file\\\\\\"; filename=\\\\\\"test.txt\\\\\\"\\r\\n")',
    )
    expect(result).toContain('appendToBody("<# File data for test.txt #>\\r\\n")')
    expect(result).toContain('appendToBody("Content-Disposition: form-data; name=\\\\\\"field\\\\\\"\\r\\n")')
    expect(result).toContain('appendToBody("value")')
    expect(result).toContain(
      'request.setValue("multipart/form-data; boundary=\\(boundary)", forHTTPHeaderField: "Content-Type")',
    )
  })

  it('handles multipart form data content types on string parts', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'user',
            value: '{"name":"scalar"}',
            contentType: 'application/json;charset=utf-8',
          },
        ],
      },
    })

    expect(result).toContain('appendToBody("Content-Type: application/json;charset=utf-8\\r\\n")')
  })

  it('handles multipart form data content types on files', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'test.txt',
            contentType: 'text/plain',
          },
        ],
      },
    })

    expect(result).toContain('appendToBody("Content-Type: text/plain\\r\\n")')
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
          {
            name: "file'name",
            fileName: 'test.txt',
          },
        ],
      },
    })

    expect(result).toContain('name=\\\\\\"field\'name\\\\\\"')
    expect(result).toContain('name=\\\\\\"file\'name\\\\\\"; filename=\\\\\\"test.txt\\\\\\"')
  })

  it('handles multipart form data with empty file names', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: '',
          },
        ],
      },
    })

    expect(result).toContain('filename=\\\\\\"\\\\\\"')
    expect(result).toContain('<# File data for file #>')
  })

  it('handles multipart fallback to text body when params are missing', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        text: 'fallback payload',
      },
    })

    expect(result).toContain('let rawBody = "fallback payload"')
    expect(result).toContain('request.httpBody = rawBody.data(using: .utf8)')
    expect(result).not.toContain('let boundary = UUID().uuidString')
  })

  it('handles url-encoded form data with special characters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'special chars!@#',
            value: 'value',
          },
        ],
      },
    })

    expect(result).toContain('let formBody = "special%20chars!%40%23=value"')
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: "field'name",
            value: 'value',
          },
        ],
      },
    })

    expect(result).toContain('let formBody = "field\'name=value"')
  })

  it('handles binary data flag', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toContain('let binaryBody = Data("binary content".utf8)')
    expect(result).toContain('request.httpBody = binaryBody')
  })

  it('handles compressed response headers', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toContain('request.setValue("gzip, deflate", forHTTPHeaderField: "Accept-Encoding")')
  })

  it('handles special characters in URL', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toContain('path%20with%20spaces')
  })

  it('handles special characters in query parameters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello%20world%20%26%20more',
        },
        {
          name: 'special',
          value: '!%40%23%24%25%5E%26*()',
        },
      ],
    })

    expect(result).toContain(
      'var request = URLRequest(url: URL(string: "https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")!)',
    )
  })

  it('handles empty URL', () => {
    const result = swiftNsurlsession.generate({
      url: '',
    })

    expect(result).toContain('var request = URLRequest(url: URL(string: "")!)')
  })

  it('handles extremely long URLs', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toContain(`var request = URLRequest(url: URL(string: "https://example.com/${'a'.repeat(2000)}")!)`)
  })

  it('handles multiple headers with same name', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toContain('request.setValue("value2", forHTTPHeaderField: "X-Custom")')
    expect(result).not.toContain('request.setValue("value1", forHTTPHeaderField: "X-Custom")')
  })

  it('handles headers with empty values', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toContain('request.setValue("", forHTTPHeaderField: "X-Empty")')
  })

  it('handles JSON body with special characters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          key: '"quotes" and \\backslashes\\',
          nested: {
            array: ['item1', null, undefined],
          },
        }),
      },
    })

    expect(result).toContain('  "key": "\\"quotes\\" and \\\\backslashes\\\\"')
    expect(result).toContain('      null')
  })

  it('handles cookies with special characters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toContain('request.setValue("special%3Bcookie=value%20with%20spaces", forHTTPHeaderField: "Cookie")')
  })

  it('prettifies JSON body', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          nested: {
            array: [1, 2, 3],
            object: { foo: 'bar' },
          },
          simple: 'value',
        }),
      },
    })

    expect(result).toContain('let jsonBody = """')
    expect(result).toContain('    "array": [')
    expect(result).toContain('      1,')
    expect(result).toContain('  "simple": "value"')
    expect(result).toContain('"""')
  })

  it('handles URLs with dollar sign characters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toContain('var request = URLRequest(url: URL(string: "https://example.com/path$with$dollars")!)')
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'price',
          value: '%24100',
        },
        {
          name: 'currency',
          value: 'USD%24',
        },
      ],
    })

    expect(result).toContain(
      'var request = URLRequest(url: URL(string: "https://example.com?price=%24100&currency=USD%24")!)',
    )
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toContain(
      'var request = URLRequest(url: URL(string: "https://example.com/api$v1/prices?amount=%2450.00")!)',
    )
  })

  it('preserves single quotes in JSON body', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toContain('"hell\'o"')
  })

  it('appends query string to URLs that already include query parameters', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com/api?foo=bar',
      queryString: [{ name: 'baz', value: 'qux' }],
    })

    expect(result).toContain('var request = URLRequest(url: URL(string: "https://example.com/api?foo=bar&baz=qux")!)')
  })

  it('keeps origin-only URLs with query parameters without adding slash', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com?existing=true',
      queryString: [{ name: 'foo', value: 'bar' }],
    })

    expect(result).toContain('var request = URLRequest(url: URL(string: "https://example.com?existing=true&foo=bar")!)')
  })

  it('supports empty text fallback for unknown body types', () => {
    const result = swiftNsurlsession.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'text/plain',
        text: '',
      },
    })

    expect(result).toContain('let rawBody = ""')
    expect(result).toContain('request.httpBody = rawBody.data(using: .utf8)')
  })

  it('combines auth headers cookies and body', () => {
    const result = swiftNsurlsession.generate(
      {
        url: 'https://example.com',
        method: 'POST',
        headers: [{ name: 'Content-Type', value: 'application/json' }],
        cookies: [{ name: 'session', value: 'abc123' }],
        postData: {
          mimeType: 'application/json',
          text: JSON.stringify({ hello: 'world' }),
        },
      },
      {
        auth: {
          username: 'user',
          password: 'pass',
        },
      },
    )

    expect(result).toContain('request.setValue("application/json", forHTTPHeaderField: "Content-Type")')
    expect(result).toContain('request.setValue("session=abc123", forHTTPHeaderField: "Cookie")')
    expect(result).toContain('let credentials = "user:pass"')
    expect(result).toContain('  "hello": "world"')
  })
})
