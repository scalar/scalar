import { describe, expect, it } from 'vitest'

import { powershellRestmethod } from './restmethod'

describe('restmethod', () => {
  it('returns a basic request', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('returns a POST request', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST'
$response`)
  })

  it('has headers', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it("doesn't add empty headers", () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('has JSON body', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"hello":"world"}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('has query string', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com?foo=bar&bar=foo' -Method 'GET'
$response`)
  })

  it('joins query string parameters with & when the URL already has a query string', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/api?existing=1&foo=bar' -Method 'GET'
$response`)
  })

  it('quotes a URL whose query string has no other special characters', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/api?param1=value1&param2=value2',
    })

    expect(
      result,
    ).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/api?param1=value1&param2=value2' -Method 'GET'
$response`)
  })

  it('has cookies', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Cookie' = 'foo=bar; bar=foo'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it("doesn't add empty cookies", () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('adds basic auth credentials', () => {
    const result = powershellRestmethod.generate(
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

    expect(result).toBe(`$headers = @{
  'Authorization' = 'Basic dXNlcjpwYXNz'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('omits auth when not provided', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('omits auth when username is missing', () => {
    const result = powershellRestmethod.generate(
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

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('omits auth when password is missing', () => {
    const result = powershellRestmethod.generate(
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

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('handles special characters in auth credentials', () => {
    const result = powershellRestmethod.generate(
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

    expect(result).toBe(`$headers = @{
  'Authorization' = 'Basic dXNlckBleGFtcGxlLmNvbTpwYXNzOndvcmQh'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('handles undefined auth object', () => {
    const result = powershellRestmethod.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET'
$response`)
  })

  it('handles multipart form data with files', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="file"; filename="test.txt"\r
Content-Type: application/octet-stream\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.IO.File]::ReadAllBytes('test.txt')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="field"\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('value')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles multipart form data content types on string parts', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="user"\r
Content-Type: application/json;charset=utf-8\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"name":"scalar"}')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('pretty-prints JSON multipart parts alongside file parts', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="file"; filename="filename"\r
Content-Type: application/octet-stream\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.IO.File]::ReadAllBytes('filename')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="props"\r
Content-Type: application/json\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"name":"","description":"","created_at":null}')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com/widget/v1/widgets' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="props"\r
Content-Type: application/json\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('not json')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles multipart form data content types on files', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="file"; filename="test.txt"\r
Content-Type: text/plain\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.IO.File]::ReadAllBytes('test.txt')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="field''name"\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('value')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="file''name"; filename="test.txt"\r
Content-Type: application/octet-stream\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.IO.File]::ReadAllBytes('test.txt')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"foo":"bar"}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/x-www-form-urlencoded'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('special+chars%21%40%23=value')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/x-www-form-urlencoded'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('field%27name=value')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles binary data flag', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/octet-stream'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('binary content')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles compressed response', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`$headers = @{
  'Accept-Encoding' = 'gzip, deflate'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('handles special characters in URL', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(
      result,
    ).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/path%20with%20spaces/[brackets]' -Method 'GET'
$response`)
  })

  it('handles special characters in query parameters', () => {
    const result = powershellRestmethod.generate({
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

    expect(
      result,
    ).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()' -Method 'GET'
$response`)
  })

  it('handles empty URL', () => {
    const result = powershellRestmethod.generate({
      url: '',
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri '' -Method 'GET'
$response`)
  })

  it('handles extremely long URLs', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/${'a'.repeat(2000)}' -Method 'GET'
$response`)
  })

  it('handles multiple headers with same name', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`$headers = @{
  'X-Custom' = 'value1, value2'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('handles headers with empty values', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`$headers = @{
  'X-Empty' = ''
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="file"; filename=""\r
Content-Type: application/octet-stream\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.IO.File]::ReadAllBytes('')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles JSON body with special characters', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"key":"\\"quotes\\" and \\\\backslashes\\\\","nested":{"array":["item1",null,null]}}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles cookies with special characters', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`$headers = @{
  'Cookie' = 'special%3Bcookie=value%20with%20spaces'
}

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'GET' -Headers $headers
$response`)
  })

  it('prettifies JSON body', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"nested":{"array":[1,2,3],"object":{"foo":"bar"}},"simple":"value"}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/path$with$dollars' -Method 'GET'
$response`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = powershellRestmethod.generate({
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

    expect(
      result,
    ).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com?price=%24100&currency=USD%24' -Method 'GET'
$response`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(
      result,
    ).toBe(`$response = Invoke-RestMethod -Uri 'https://example.com/api$v1/prices?amount=%2450.00' -Method 'GET'
$response`)
  })

  it('pretty-prints --data bodies whose mimeType uses a +json suffix', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/vnd.api+json'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"a":1}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('pretty-prints --data bodies whose mimeType includes a charset parameter', () => {
    const result = powershellRestmethod.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json;charset=utf-8'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"a":1}')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('pretty-prints --form parts whose contentType uses a +json suffix', () => {
    const result = powershellRestmethod.generate({
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

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'multipart/form-data; boundary=scalar-boundary'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary\r
Content-Disposition: form-data; name="props"\r
Content-Type: application/vnd.custom+json\r
\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('{"a":1}')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('\r
')
$body.Write($bytes, 0, $bytes.Length)
$bytes = [System.Text.Encoding]::UTF8.GetBytes('--scalar-boundary--\r
')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('escapes single quotes in JSON body', () => {
    const result = powershellRestmethod.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toBe(`$headers = @{
  'Content-Type' = 'application/json'
}

$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('"hell''o"')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://editor.scalar.com/test' -Method 'POST' -Headers $headers -Body $body.ToArray()
$body.Dispose()
$response`)
  })

  it('generates a body without a content-type header', () => {
    const result = powershellRestmethod.generate({
      method: 'POST',
      url: 'https://example.com/hello',
      postData: { mimeType: '', text: 'hello' },
    })

    expect(result).toBe(`$body = [System.IO.MemoryStream]::new()
$bytes = [System.Text.Encoding]::UTF8.GetBytes('hello')
$body.Write($bytes, 0, $bytes.Length)

$response = Invoke-RestMethod -Uri 'https://example.com/hello' -Method 'POST' -Body $body.ToArray()
$body.Dispose()
$response`)
  })
})
