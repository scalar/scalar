import { describe, expect, it } from 'vitest'

import { shellHttpie } from './httpie'

describe('httpie', () => {
  it('curl: returns a basic request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: returns a POST request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe("http --ignore-stdin 'POST' 'https://example.com'")
  })

  it('curl: has headers', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Content-Type:application/json'`)
  })

  it("curl: doesn't add empty headers", () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: has JSON body', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/json' \\
  --raw='{"hello":"world"}'`)
  })

  it('curl: has query string', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com?foo=bar&bar=foo'")
  })

  it('curl: joins query string parameters with & when the URL already has a query string', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/api?existing=1&foo=bar'")
  })

  it('curl: quotes a URL whose query string has no other special characters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/api?param1=value1&param2=value2'")
  })

  it('curl: has cookies', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Cookie:foo=bar; bar=foo'`)
  })

  it("curl: doesn't add empty cookies", () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: adds basic auth credentials', () => {
    const result = shellHttpie.generate(
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

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Authorization:Basic dXNlcjpwYXNz'`)
  })

  it('curl: omits auth when not provided', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: omits auth when username is missing', () => {
    const result = shellHttpie.generate(
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

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: omits auth when password is missing', () => {
    const result = shellHttpie.generate(
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

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: handles special characters in auth credentials', () => {
    const result = shellHttpie.generate(
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

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Authorization:Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh'`)
  })

  it('curl: handles undefined auth object', () => {
    const result = shellHttpie.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('curl: handles multipart form data with files', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file"; filename="test.txt"\\0015\\0012Content-Type: application/octet-stream\\0015\\0012\\0015\\0012'
  cat -- 'test.txt'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="field"\\0015\\0012\\0015\\0012'
  printf '%b' 'value'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: handles multipart form data content types on string parts', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="user"\\0015\\0012Content-Type: application/json;charset=utf-8\\0015\\0012\\0015\\0012'
  printf '%b' '{"name":"scalar"}'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: pretty-prints JSON multipart parts alongside file parts', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/widget/v1/widgets',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'filename',
          },
          {
            name: 'props',
            value: '{"name":"","description":"","created_at":null}',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file"; filename="filename"\\0015\\0012Content-Type: application/octet-stream\\0015\\0012\\0015\\0012'
  cat -- 'filename'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="props"\\0015\\0012Content-Type: application/json\\0015\\0012\\0015\\0012'
  printf '%b' '{"name":"","description":"","created_at":null}'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com/widget/v1/widgets' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: 'not json',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="props"\\0015\\0012Content-Type: application/json\\0015\\0012\\0015\\0012'
  printf '%b' 'not json'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: handles multipart form data content types on files', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file"; filename="test.txt"\\0015\\0012Content-Type: text/plain\\0015\\0012\\0015\\0012'
  cat -- 'test.txt'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: handles multipart form data with single quotes in parameter name', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="field'\\''name"\\0015\\0012\\0015\\0012'
  printf '%b' 'value'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file'\\''name"; filename="test.txt"\\0015\\0012Content-Type: application/octet-stream\\0015\\0012\\0015\\0012'
  cat -- 'test.txt'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: handles multipart form data with JSON payload', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data' \\
  --raw='{"foo":"bar"}'`)
  })

  it('curl: handles url-encoded form data with special characters', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/x-www-form-urlencoded' \\
  --raw='special+chars%21%40%23=value'`)
  })

  it('curl: handles url-encoded form data with single quotes in parameter name', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/x-www-form-urlencoded' \\
  --raw='field%27name=value'`)
  })

  it('curl: handles binary data flag', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/octet-stream' \\
  --raw='binary content'`)
  })

  it('curl: handles compressed response', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Accept-Encoding:gzip, deflate'`)
  })

  it('curl: handles special characters in URL', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/path%20with%20spaces/[brackets]'")
  })

  it('curl: handles special characters in query parameters', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(
      "http --ignore-stdin 'GET' 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()'",
    )
  })

  it('curl: handles empty URL', () => {
    const result = shellHttpie.generate({
      url: '',
    })

    expect(result).toBe("http --ignore-stdin 'GET' ''")
  })

  it('curl: handles extremely long URLs', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com/${'a'.repeat(2000)}'`)
  })

  it('curl: handles multiple headers with same name', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'X-Custom:value1' \\
  'X-Custom:value2'`)
  })

  it('curl: handles headers with empty values', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'X-Empty;'`)
  })

  it('curl: handles multipart form data with empty file names', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file"; filename=""\\0015\\0012Content-Type: application/octet-stream\\0015\\0012\\0015\\0012'
  cat -- ''
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: handles JSON body with special characters', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/json' \\
  --raw='{"key":"\\"quotes\\" and \\\\backslashes\\\\","nested":{"array":["item1",null,null]}}'`)
  })

  it('curl: handles cookies with special characters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Cookie:special%3Bcookie=value%20with%20spaces'`)
  })

  it('curl: prettifies JSON body', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/json' \\
  --raw='{"nested":{"array":[1,2,3],"object":{"foo":"bar"}},"simple":"value"}'`)
  })

  it('curl: handles URLs with dollar sign characters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/path$with$dollars'")
  })

  it('curl: handles URLs with dollar signs in query parameters', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com?price=%24100&currency=USD%24'")
  })

  it('curl: handles URLs with dollar signs in path and query', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/api$v1/prices?amount=%2450.00'")
  })

  it('curl: pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/vnd.api+json' \\
  --raw='{"a":1}'`)
  })

  it('curl: pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/json;charset=utf-8' \\
  --raw='{"a":1}'`)
  })

  it('curl: pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: '{"a":1}',
            contentType: 'application/vnd.custom+json',
          },
        ],
      },
    })

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="props"\\0015\\0012Content-Type: application/vnd.custom+json\\0015\\0012\\0015\\0012'
  printf '%b' '{"a":1}'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('curl: escapes single quotes in JSON body', () => {
    const result = shellHttpie.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://editor.scalar.com/test' \\
  'Content-Type:application/json' \\
  --raw='"hell'\\''o"'`)
  })
  it('returns a basic request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com'")
  })

  it('returns a POST request', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe("http --ignore-stdin 'POST' 'https://example.com'")
  })

  it('has headers', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'Content-Type:application/json'`)
  })

  it('handles multipart form data with files', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`{
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="file"; filename="test.txt"\\0015\\0012Content-Type: application/octet-stream\\0015\\0012\\0015\\0012'
  cat -- 'test.txt'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary\\0015\\0012Content-Disposition: form-data; name="field"\\0015\\0012\\0015\\0012'
  printf '%b' 'value'
  printf '%b' '\\0015\\0012'
  printf '%b' '--scalar-boundary--\\0015\\0012'
} | http 'POST' 'https://example.com' \\
  'Content-Type:multipart/form-data; boundary=scalar-boundary'`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = shellHttpie.generate({
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

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/x-www-form-urlencoded' \\
  --raw='special+chars%21%40%23=value'`)
  })

  it('handles binary data', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`http --ignore-stdin 'POST' 'https://example.com' \\
  'Content-Type:application/octet-stream' \\
  --raw='binary content'`)
  })

  it('handles special characters in URL', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe("http --ignore-stdin 'GET' 'https://example.com/path%20with%20spaces/[brackets]'")
  })

  it('handles multiple headers with same name', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'X-Custom:value1' \\
  'X-Custom:value2'`)
  })

  it('handles headers with empty values', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`http --ignore-stdin 'GET' 'https://example.com' \\
  'X-Empty;'`)
  })

  it('handles query string parameters', () => {
    const result = shellHttpie.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      "http --ignore-stdin 'GET' 'https://example.com/api?param1=value1&param2=special%20value&param3=123'",
    )
  })
  it('passes a dash-prefixed raw body as a literal option value', () => {
    expect(
      shellHttpie.generate({
        url: 'https://example.com',
        method: 'POST',
        postData: { mimeType: 'text/plain', text: '--hello' },
      }),
    ).toBe(
      ["http --ignore-stdin 'POST' 'https://example.com'", "'Content-Type:text/plain'", "--raw='--hello'"].join(
        ' \\\n  ',
      ),
    )
  })
})
