import { describe, expect, it } from 'vitest'

import { pythonPython3 } from './python3'

const expectCommonResponseHandling = (result: string): void => {
  expect(result).toContain('response = conn.getresponse()')
  expect(result).toContain('print(response.read().decode())')
  expect(result).toContain('conn.close()')
}

describe('pythonPython3', () => {
  it('returns a basic request', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
    })

    expect(result).toContain('import http.client')
    expect(result).toContain('conn = http.client.HTTPSConnection("example.com")')
    expect(result).toContain('conn.request("GET", "/")')
    expect(result).not.toContain('headers =')
    expectCommonResponseHandling(result)
  })

  it('returns a POST request', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toContain('conn.request("POST", "/")')
    expectCommonResponseHandling(result)
  })

  it('has headers', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toContain('headers = {\n  "Content-Type": "application/json"\n}')
    expect(result).toContain('headers=headers')
  })

  it(`doesn't add empty headers`, () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).not.toContain('headers =')
    expect(result).toContain('conn.request("GET", "/")')
  })

  it('has JSON body', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toContain('import json')
    expect(result).toContain('payload = json.dumps({\n  "hello": "world"\n})')
    expect(result).toContain('conn.request(\n    "POST",\n    "/",\n    body=payload,\n    headers=headers,\n)')
  })

  it('has query string', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('conn.request("GET", "/?foo=bar&bar=foo")')
  })

  it('has cookies', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('"Cookie": "foo=bar; bar=foo"')
    expect(result).toContain('headers=headers')
  })

  it(`doesn't add empty cookies`, () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).not.toContain('Cookie')
    expect(result).toContain('conn.request("GET", "/")')
  })

  it('adds basic auth credentials', () => {
    const result = pythonPython3.generate(
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

    expect(result).toContain('"Authorization": "Basic dXNlcjpwYXNz"')
  })

  it('omits auth when not provided', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('Authorization')
  })

  it('omits auth when username is missing', () => {
    const result = pythonPython3.generate(
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

    expect(result).not.toContain('Authorization')
  })

  it('omits auth when password is missing', () => {
    const result = pythonPython3.generate(
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

    expect(result).not.toContain('Authorization')
  })

  it('handles special characters in auth credentials', () => {
    const result = pythonPython3.generate(
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

    expect(result).toContain('"Authorization": "Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh"')
  })

  it('handles undefined auth object', () => {
    const result = pythonPython3.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).not.toContain('Authorization')
  })

  it('handles multipart form data with files', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('boundary = "----ScalarSnippetzBoundary"')
    expect(result).toContain('filename=\\"test.txt\\"')
    expect(result).toContain('data_list.append(open("test.txt", "rb").read().decode("latin-1"))')
    expect(result).toContain('data_list.append("value")')
  })

  it('handles multipart form data content types on string parts', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('data_list.append("Content-Type: application/json;charset=utf-8")')
  })

  it('handles multipart form data content types on files', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('data_list.append("Content-Type: text/plain")')
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('name=\\"field\'name\\"')
    expect(result).toContain('name=\\"file\'name\\"; filename=\\"test.txt\\"')
  })

  it('handles multipart form data with JSON payload', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        text: JSON.stringify({
          foo: 'bar',
        }),
      },
    })

    expect(result).toContain('payload = json.dumps({\n  "foo": "bar"\n})')
    expect(result).toContain('"Content-Type": "multipart/form-data"')
  })

  it('handles url-encoded form data with special characters', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('import urllib.parse')
    expect(result).toContain('payload = urllib.parse.urlencode({')
    expect(result).toContain('"special chars!@#": "value"')
    expect(result).toContain('"Content-Type": "application/x-www-form-urlencoded"')
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('"field\'name": "value"')
  })

  it('handles binary data flag', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toContain('payload = b"binary content"')
    expect(result).toContain('body=payload')
  })

  it('handles compressed response', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toContain('"Accept-Encoding": "gzip, deflate"')
  })

  it('handles special characters in URL', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toContain('conn.request("GET", "/path%20with%20spaces/[brackets]")')
  })

  it('handles special characters in query parameters', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('conn.request("GET", "/?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")')
  })

  it('handles empty URL', () => {
    const result = pythonPython3.generate({
      url: '',
    })

    expect(result).toContain('conn = http.client.HTTPSConnection("example.com")')
    expect(result).toContain('conn.request("GET", "/")')
  })

  it('handles extremely long URLs', () => {
    const longPath = 'a'.repeat(2000)
    const result = pythonPython3.generate({
      url: `https://example.com/${longPath}`,
    })

    expect(result).toContain(`conn.request("GET", "/${longPath}")`)
  })

  it('handles multiple headers with same name', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toContain('"X-Custom": "value1"')
    expect(result).not.toContain('"X-Custom": "value2"')
  })

  it('handles headers with empty values', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toContain('"X-Empty": ""')
  })

  it('handles multipart form data with empty file names', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('filename=\\"\\"')
    expect(result).toContain('open("", "rb")')
  })

  it('handles JSON body with special characters', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
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

    expect(result).toContain('"key": "\\"quotes\\" and \\\\backslashes\\\\"')
    expect(result).toContain('"array": [\n      "item1",\n      None,\n      None\n    ]')
  })

  it('handles cookies with special characters', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toContain('"Cookie": "special%3Bcookie=value%20with%20spaces"')
  })

  it('prettifies JSON body', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
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

    expect(result).toContain('"nested": {\n    "array": [\n      1,\n      2,\n      3\n    ]')
    expect(result).toContain('"simple": "value"')
  })

  it('handles URLs with dollar sign characters', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toContain('conn.request("GET", "/path$with$dollars")')
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = pythonPython3.generate({
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

    expect(result).toContain('conn.request("GET", "/?price=%24100&currency=USD%24")')
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toContain('conn.request("GET", "/api$v1/prices?amount=%2450.00")')
  })

  it('escapes single quotes in JSON body', () => {
    const result = pythonPython3.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toContain('payload = json.dumps("hell\'o")')
  })
})
