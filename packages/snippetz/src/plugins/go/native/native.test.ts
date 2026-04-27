import { describe, expect, it } from 'vitest'

import { goNative } from './native'

describe('goNative', () => {
  it('returns an empty string for undefined request', () => {
    const result = goNative.generate()

    expect(result).toBe('')
  })

  it('returns a basic request', () => {
    const result = goNative.generate({
      url: 'https://example.com',
    })

    expect(result).toContain(`requestUrl := "https://example.com"`)
    expect(result).toContain(`req, _ := http.NewRequest("GET", requestUrl, nil)`)
  })

  it('returns a POST request', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toContain(`req, _ := http.NewRequest("POST", requestUrl, nil)`)
  })

  it('has headers', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
    })

    expect(result).toContain(`req.Header.Add("Content-Type", "application/json")`)
  })

  it('does not add empty headers', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).not.toContain('req.Header.Add(')
  })

  it('has JSON body', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toContain('payload := strings.NewReader(`{')
    expect(result).toContain('  "hello": "world"')
    expect(result).toContain('}`)')
    expect(result).toContain(`req, _ := http.NewRequest("POST", requestUrl, payload)`)
  })

  it('has query string', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`requestUrl := "https://example.com?foo=bar&bar=foo"`)
  })

  it('has cookies', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`req.Header.Add("Cookie", "foo=bar; bar=foo")`)
  })

  it('does not add empty cookies', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).not.toContain(`req.Header.Add("Cookie",`)
  })

  it('adds basic auth credentials', () => {
    const result = goNative.generate(
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

    expect(result).toContain(`req.SetBasicAuth("user", "pass")`)
  })

  it('omits auth when not provided', () => {
    const result = goNative.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('req.SetBasicAuth(')
  })

  it('omits auth when username is missing', () => {
    const result = goNative.generate(
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

    expect(result).not.toContain('req.SetBasicAuth(')
  })

  it('omits auth when password is missing', () => {
    const result = goNative.generate(
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

    expect(result).not.toContain('req.SetBasicAuth(')
  })

  it('handles special characters in auth credentials', () => {
    const result = goNative.generate(
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

    expect(result).toContain(`req.SetBasicAuth("user@example.com", "pass:word!")`)
  })

  it('handles multipart form data with files', () => {
    const result = goNative.generate({
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

    expect(result).toContain('payload := &bytes.Buffer{}')
    expect(result).toContain(`part, _ := writer.CreateFormFile("file", "test.txt")`)
    expect(result).toContain(`f, _ := os.Open("test.txt")`)
    expect(result).toContain(`_ = writer.WriteField("field", "value")`)
    expect(result).toContain(`req.Header.Set("Content-Type", writer.FormDataContentType())`)
  })

  it('uses assignment for additional multipart file params', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file1',
            fileName: 'test-1.txt',
          },
          {
            name: 'file2',
            fileName: 'test-2.txt',
          },
        ],
      },
    })

    expect(result).toContain(`part, _ := writer.CreateFormFile("file1", "test-1.txt")`)
    expect(result).toContain(`f, _ := os.Open("test-1.txt")`)
    expect(result).toContain(`part, _ = writer.CreateFormFile("file2", "test-2.txt")`)
    expect(result).toContain(`f, _ = os.Open("test-2.txt")`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`part, _ := writer.CreateFormFile("file", "")`)
    expect(result).toContain(`f, _ := os.Open("")`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`_ = writer.WriteField("field'name", "value")`)
    expect(result).toContain(`part, _ := writer.CreateFormFile("file'name", "test.txt")`)
  })

  it('handles multipart fallback to text body when params are missing', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        text: 'fallback payload',
      },
    })

    expect(result).toContain(`payload := strings.NewReader("fallback payload")`)
    expect(result).not.toContain('multipart.NewWriter')
  })

  it('handles url-encoded form data with special characters', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`\tneturl "net/url"`)
    expect(result).toContain('postData := neturl.Values{}')
    expect(result).toContain(`postData.Set("special chars!@#", "value")`)
    expect(result).toContain(`req, _ := http.NewRequest("POST", requestUrl, strings.NewReader(postData.Encode()))`)
    expect(result).not.toContain('\n\turl :=')
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`postData.Set("field'name", "value")`)
  })

  it('handles binary data', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toContain(`payload := strings.NewReader("binary content")`)
  })

  it('handles special characters in URL', () => {
    const result = goNative.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toContain(`requestUrl := "https://example.com/path%20with%20spaces/[brackets]"`)
  })

  it('handles special characters in query parameters', () => {
    const result = goNative.generate({
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
      `requestUrl := "https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()"`,
    )
  })

  it('handles empty URL', () => {
    const result = goNative.generate({
      url: '',
    })

    expect(result).toContain(`requestUrl := ""`)
  })

  it('handles extremely long URLs', () => {
    const result = goNative.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toContain(`requestUrl := "https://example.com/${'a'.repeat(2000)}"`)
  })

  it('handles multiple headers with same name', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toContain(`req.Header.Add("X-Custom", "value2")`)
    expect(result).not.toContain(`req.Header.Add("X-Custom", "value1")`)
  })

  it('handles headers with empty values', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toContain(`req.Header.Add("X-Empty", "")`)
  })

  it('handles cookies with special characters', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toContain(`req.Header.Add("Cookie", "special%3Bcookie=value%20with%20spaces")`)
  })

  it('prettifies JSON body', () => {
    const result = goNative.generate({
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

    expect(result).toContain('payload := strings.NewReader(`{')
    expect(result).toContain('    "array": [')
    expect(result).toContain('      1,')
    expect(result).toContain('  "simple": "value"')
    expect(result).toContain('}`)')
  })

  it('handles URLs with dollar sign characters', () => {
    const result = goNative.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toContain(`requestUrl := "https://example.com/path$with$dollars"`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = goNative.generate({
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

    expect(result).toContain(`requestUrl := "https://example.com?price=%24100&currency=USD%24"`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = goNative.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toContain(`requestUrl := "https://example.com/api$v1/prices?amount=%2450.00"`)
  })

  it('escapes single quotes in JSON body fallback text', () => {
    const result = goNative.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: `'hell'o'`,
      },
    })

    expect(result).toContain("payload := strings.NewReader(`'hell'o'`)")
  })

  it('appends query string to URLs that already include query parameters', () => {
    const result = goNative.generate({
      url: 'https://example.com/api?foo=bar',
      queryString: [{ name: 'baz', value: 'qux' }],
    })

    expect(result).toContain(`requestUrl := "https://example.com/api?foo=bar&baz=qux"`)
  })

  it('keeps origin-only URLs with query parameters without adding slash', () => {
    const result = goNative.generate({
      url: 'https://example.com?existing=true',
      queryString: [{ name: 'foo', value: 'bar' }],
    })

    expect(result).toContain(`requestUrl := "https://example.com?existing=true&foo=bar"`)
  })

  it('supports empty text fallback for unknown body types', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'text/plain',
        text: '',
      },
    })

    expect(result).toContain(`payload := strings.NewReader("")`)
  })

  it('combines auth headers cookies and body', () => {
    const result = goNative.generate(
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

    expect(result).toContain(`req.SetBasicAuth("user", "pass")`)
    expect(result).toContain(`req.Header.Add("Content-Type", "application/json")`)
    expect(result).toContain(`req.Header.Add("Cookie", "session=abc123")`)
    expect(result).toContain('payload := strings.NewReader(`{')
    expect(result).toContain('  "hello": "world"')
    expect(result).toContain('}`)')
  })

  it('falls back to quoted strings for JSON payloads containing backticks', () => {
    const result = goNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          script: 'const value = `hello`',
        }),
      },
    })

    expect(result).toContain('payload := strings.NewReader("{\\n  \\"script\\": \\"const value = `hello`\\"\\n}")')
  })
})
