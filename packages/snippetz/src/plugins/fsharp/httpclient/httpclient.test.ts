import { describe, expect, it } from 'vitest'

import { fsharpHttpclient } from './httpclient'

describe('fsharpHttpclient.generate', () => {
  it('should return an empty string if request is falsy', () => {
    expect(fsharpHttpclient.generate(undefined, {})).toBe('')
    expect(fsharpHttpclient.generate(false as any, {})).toBe('')
  })

  it('includes SendAsync call in generated code', () => {
    const request = { url: 'https://api.com/', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let! result = client.SendAsync(httpRequestMessage)')
  })
})

describe('fsharpHttpclient.generate - query strings', () => {
  it('appends extracted query string to url using real helpers', () => {
    const request = {
      url: 'https://example.com/path',
      method: 'GET',
      queryString: [
        { name: 'a', value: '1' },
        { name: 'b', value: '2' },
      ],
    } as any

    const result = fsharpHttpclient.generate(request, {})

    // helpers produce "a=1&b=2"; current generator concatenates with "="
    expect(result).toContain('new Uri("https://example.com/path?a=1&b=2")')
  })

  it('keeps url unchanged when no queryString provided', () => {
    const request = { url: 'https://example.com/', method: 'GET' } as any

    const result = fsharpHttpclient.generate(request, {})

    expect(result).toContain('new Uri("https://example.com/")')
  })
})

describe('fsharpHttpclient.generate - HttpRequestMessage initialization', () => {
  it('generates correct HttpRequestMessage for GET method', () => {
    const request = { url: 'https://api.com/', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      `let httpRequestMessage = new HttpRequestMessage(
  HttpMethod("GET"),
  new Uri("https://api.com/")
)`,
    )
  })

  it('generates correct HttpRequestMessage for POST method', () => {
    const request = { url: 'https://api.com/resource', method: 'POST' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      `let httpRequestMessage = new HttpRequestMessage(
  HttpMethod("POST"),
  new Uri("https://api.com/resource")
)`,
    )
  })

  it('includes query string in HttpRequestMessage', () => {
    const request = {
      url: 'https://api.com/data',
      method: 'GET',
      queryString: [{ name: 'q', value: 'search' }],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      `let httpRequestMessage = new HttpRequestMessage(
  HttpMethod("GET"),
  new Uri("https://api.com/data?q=search")
)`,
    )
  })
})

describe('fsharpHttpclient.generate - headers', () => {
  it('adds a single header to HttpRequestMessage', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      headers: [{ name: 'Authorization', value: 'Bearer token' }],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('httpRequestMessage.Headers.Add("Authorization", "Bearer token")')
  })

  it('adds multiple headers to HttpRequestMessage', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      headers: [
        { name: 'Accept', value: 'application/json' },
        { name: 'User-Agent', value: 'TestAgent' },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('httpRequestMessage.Headers.Add("Accept", "application/json")')
    expect(result).toContain('httpRequestMessage.Headers.Add("User-Agent", "TestAgent")')
  })

  it('does not add headers if none are provided', () => {
    const request = { url: 'https://api.com/', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).not.toContain('httpRequestMessage.Headers.Add')
  })
})

describe('fsharpHttpclient.generate - postData', () => {
  it('adds JSON postData to HttpRequestMessage', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"key":"value"}',
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      'let content = new StringContent("""{\n  "key": "value"\n}""", Encoding.UTF8, "application/json")',
    )
    expect(result).toContain('httpRequestMessage.Content <- content')
  })

  it('adds multiple form-urlencoded params to HttpRequestMessage', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'foo', value: 'bar' },
          { name: 'baz', value: 'qux' },
        ],
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let formUrlEncodedContentDictionary = new Dictionary<string, string>()')
    expect(result).toContain('formUrlEncodedContentDictionary.Add("foo", "bar")')
    expect(result).toContain('formUrlEncodedContentDictionary.Add("baz", "qux")')
    expect(result).toContain('let content = new FormUrlEncodedContent(formUrlEncodedContentDictionary)')
    expect(result).toContain('httpRequestMessage.Content <- content')
  })

  it('adds single string param to MultipartFormDataContent', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [{ name: 'field1', value: 'value1' }],
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let content = new MultipartFormDataContent()')
    expect(result).toContain('content.Add(new StringContent("value1"), "field1")')
    expect(result).toContain('httpRequestMessage.Content <- content')
  })

  it('adds file param to MultipartFormDataContent', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [{ name: 'file1', value: 'BINARY', fileName: 'test.txt', contentType: 'text/plain' }],
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead("test.txt"))')
    expect(result).toContain('fileStreamContent_0.Headers.ContentType <- MediaTypeHeaderValue("text/plain")')
    expect(result).toContain('content.Add(fileStreamContent_0, "test.txt", "test.txt")')
    expect(result).toContain('httpRequestMessage.Content <- content')
  })

  it('adds multiple string and file params to MultipartFormDataContent', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          { name: 'field1', value: 'value1' },
          { name: 'file1', value: 'BINARY', fileName: 'test.txt', contentType: 'text/plain' },
        ],
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let content = new MultipartFormDataContent()')
    expect(result).toContain('content.Add(new StringContent("value1"), "field1")')
    expect(result).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead("test.txt"))')
    expect(result).toContain('fileStreamContent_0.Headers.ContentType <- MediaTypeHeaderValue("text/plain")')
    expect(result).toContain('content.Add(fileStreamContent_0, "test.txt", "test.txt")')
    expect(result).toContain('httpRequestMessage.Content <- content')
  })
})

describe('fsharpHttpclient.generate - cookies', () => {
  it('does not add cookies if cookies array is empty', () => {
    const request = { url: 'https://api.com/', method: 'GET', cookies: [] } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let client = new HttpClient()')
    expect(result).not.toContain('CookieContainer')
  })

  it('does not add cookies if cookies is undefined', () => {
    const request = { url: 'https://api.com/', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let client = new HttpClient()')
    expect(result).not.toContain('CookieContainer')
  })

  it('does not add cookies if url is missing', () => {
    const request = { method: 'GET', cookies: [{ name: 'foo', value: 'bar' }] } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let client = new HttpClient()')
    expect(result).not.toContain('CookieContainer')
  })

  it('adds cookies if cookies array is present and url is provided', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      cookies: [
        { name: 'foo', value: 'bar' },
        { name: 'baz', value: 'qux' },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let cookieContainer = CookieContainer()')
    expect(result).toContain('cookieContainer.Add(Uri("https://api.com/"), Cookie("foo", "bar"))')
    expect(result).toContain('cookieContainer.Add(Uri("https://api.com/"), Cookie("baz", "qux"))')
    expect(result).toContain('handler.CookieContainer <- cookieContainer')
    expect(result).toContain('let client = new HttpClient(handler)')
  })

  it('handles cookies with special characters', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      'cookieContainer.Add(Uri("https://api.com/"), Cookie("special;cookie", "value with spaces"))',
    )
  })
})

describe('fsharpHttpclient.generate - edge cases', () => {
  it('handles empty URL', () => {
    const request = { url: '', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(`let httpRequestMessage = new HttpRequestMessage(
  HttpMethod("GET"),
  new Uri("")
)`)
  })

  it('handles extremely long URLs', () => {
    const longUrl = 'https://example.com/' + 'a'.repeat(2000)
    const request = { url: longUrl, method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(`new Uri("${longUrl}")`)
  })

  it('handles special characters in URL', () => {
    const request = { url: 'https://example.com/path with spaces/[brackets]', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('new Uri("https://example.com/path with spaces/[brackets]")')
  })

  it('handles special characters in query parameters', () => {
    const request = {
      url: 'https://example.com',
      method: 'GET',
      queryString: [
        { name: 'q', value: 'hello world & more' },
        { name: 'special', value: '!@#$%^&*()' },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('new Uri("https://example.com?q=hello world & more&special=!@#$%^&*()")')
  })

  it('handles URLs with dollar signs', () => {
    const request = { url: 'https://example.com/path$with$dollars', method: 'GET' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('new Uri("https://example.com/path$with$dollars")')
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const request = {
      url: 'https://example.com',
      method: 'GET',
      queryString: [
        { name: 'price', value: '$100' },
        { name: 'currency', value: 'USD$' },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('new Uri("https://example.com?price=$100&currency=USD$")')
  })

  it('handles URLs with dollar signs in path and query', () => {
    const request = {
      url: 'https://example.com/api$v1/prices',
      method: 'GET',
      queryString: [{ name: 'amount', value: '$50.00' }],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('new Uri("https://example.com/api$v1/prices?amount=$50.00"')
  })

  it('handles multiple headers with same name', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('httpRequestMessage.Headers.Add("X-Custom", "value1")')
    expect(result).toContain('httpRequestMessage.Headers.Add("X-Custom", "value2")')
  })

  it('handles headers with empty values', () => {
    const request = {
      url: 'https://api.com/',
      method: 'GET',
      headers: [{ name: 'X-Empty', value: '' }],
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('httpRequestMessage.Headers.Add("X-Empty", "")')
  })

  it('handles multipart form data with empty file names', () => {
    const request = {
      url: 'https://api.com/',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [{ name: 'file', fileName: '', value: 'BINARY' }],
      },
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead(""))')
    expect(result).toContain('content.Add(fileStreamContent_0, "", "")')
  })

  it('handles JSON body with special characters', () => {
    const request = {
      url: 'https://api.com/',
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
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      'let content = new StringContent("""{\n  "key": "\\"quotes\\" and \\\\backslashes\\\\",\n  "nested": {\n    "array": [\n      "item1",\n      null,\n      null\n    ]\n  }\n}""", Encoding.UTF8, "application/json")',
    )
  })

  it('prettifies JSON body', () => {
    const request = {
      url: 'https://api.com/',
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
    } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      'let content = new StringContent("""{\n  "nested": {\n    "array": [\n      1,\n      2,\n      3\n    ],\n    "object": {\n      "foo": "bar"\n    }\n  },\n  "simple": "value"\n}""", Encoding.UTF8, "application/json")',
    )
  })
})
