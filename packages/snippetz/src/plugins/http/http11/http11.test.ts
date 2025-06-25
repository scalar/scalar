import { describe, expect, it } from 'vitest'

import { httpHttp11 } from './http11'

describe('httpHttp11', () => {
  it('returns a basic request', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
    })

    expect(result).toBe('GET / HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n')
  })

  it('returns a POST request', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe('POST / HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n')
  })

  it('has headers', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe('GET / HTTP/1.1\r\n' + 'Host: example.com\r\n' + 'Content-Type: application/json\r\n' + '\r\n')
  })

  it("doesn't add the JSON header twice", () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'post',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: '{"foo": "bar"}',
      },
    })

    expect(result).toBe(
      'POST / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        'Content-Type: application/json\r\n' +
        '\r\n' +
        '{"foo": "bar"}',
    )
  })

  it('handles multipart form data with files', () => {
    const result = httpHttp11.generate({
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

    expect(result).toMatch(
      'POST / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        'Content-Type: multipart/form-data; boundary=----WebKitFormBoundary7MA4YWxkTrZu0gW\r\n' +
        '\r\n' +
        '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n' +
        '\r\n' +
        '------WebKitFormBoundary7MA4YWxkTrZu0gW\r\n' +
        'Content-Disposition: form-data; name="field"\r\n' +
        '\r\n' +
        'value\r\n' +
        '------WebKitFormBoundary7MA4YWxkTrZu0gW--\r\n',
    )
  })

  it('handles url-encoded form data with special characters', () => {
    const result = httpHttp11.generate({
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

    expect(result).toBe(
      'POST / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        'Content-Type: application/x-www-form-urlencoded\r\n' +
        '\r\n' +
        'special%20chars!%40%23=value',
    )
  })

  it('handles binary data', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(
      'POST / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        'Content-Type: application/octet-stream\r\n' +
        '\r\n' +
        'binary content',
    )
  })

  it('handles special characters in URL', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe('GET /path%20with%20spaces/[brackets] HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n')
  })

  it('handles multiple headers with same name', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      'GET / HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        // RFC 7230 states a server must not generate multiple header fields with the same field name unless either the entire field value for that header field is defined as a comma-separated list, or the header field is a well-known exception.
        'X-Custom: value1, value2\r\n' +
        '\r\n',
    )
  })

  it('handles headers with empty values', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe('GET / HTTP/1.1\r\n' + 'Host: example.com\r\n' + 'X-Empty: \r\n' + '\r\n')
  })

  it('handles query string parameters', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      'GET /api?param1=value1&param2=special%20value&param3=123 HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n',
    )
  })

  it('handles invalid URL', () => {
    const result = httpHttp11.generate({
      url: '/foo',
    })

    expect(result).toBe('GET /foo HTTP/1.1\r\n' + 'Host: UNKNOWN_HOSTNAME\r\n' + '\r\n')
  })

  it('handles empty URL', () => {
    const result = httpHttp11.generate({
      url: '',
    })

    expect(result).toBe('GET / HTTP/1.1\r\n' + 'Host: UNKNOWN_HOSTNAME\r\n' + '\r\n')
  })

  it('handles extremely long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000)
    const result = httpHttp11.generate({
      url: longUrl,
    })

    expect(result).toBe(`GET /${'a'.repeat(2000)} HTTP/1.1\r\n` + 'Host: example.com\r\n' + '\r\n')
  })

  it('handles special characters in query parameters', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'q',
          value: 'hello world & more',
        },
        {
          name: 'special',
          value: '!@#$%^&*()',
        },
      ],
    })

    expect(result).toBe(
      'GET /?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*() HTTP/1.1\r\n' + 'Host: example.com\r\n\r\n',
    )
  })
})
