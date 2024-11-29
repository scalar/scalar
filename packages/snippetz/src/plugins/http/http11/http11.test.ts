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

    expect(result).toBe(
      'POST / HTTP/1.1\r\n' + 'Host: example.com\r\n' + '\r\n',
    )
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
    expect(result).toBe(
      'GET / HTTP/1.1\r\n' +
        'Content-Type: application/json\r\n' +
        'Host: example.com\r\n' +
        '\r\n',
    )
  })

  it.skip('handles multipart form data with files', () => {
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
        'Content-Type: multipart/form-data; boundary=.*\r\n' +
        '\r\n' +
        '--.*\r\n' +
        'Content-Disposition: form-data; name="file"; filename="test.txt"\r\n' +
        '\r\n' +
        '--.*\r\n' +
        'Content-Disposition: form-data; name="field"\r\n' +
        '\r\n' +
        'value\r\n' +
        '--.*--\r\n',
    )
  })

  it.skip('handles url-encoded form data with special characters', () => {
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
        'special%20chars%21%40%23=value',
    )
  })

  it.skip('handles binary data', () => {
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

    expect(result).toBe(
      'GET /path%20with%20spaces/%5Bbrackets%5D HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        '\r\n',
    )
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
        'X-Custom: value2\r\n' +
        'Host: example.com\r\n' +
        '\r\n',
    )
  })

  it('handles headers with empty values', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      'GET / HTTP/1.1\r\n' + 'X-Empty: \r\n' + 'Host: example.com\r\n' + '\r\n',
    )
  })

  it('handles query string parameters', () => {
    const result = httpHttp11.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      'GET /api?param1=value1&param2=special%20value&param3=123 HTTP/1.1\r\n' +
        'Host: example.com\r\n' +
        '\r\n',
    )
  })
})
