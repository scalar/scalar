import { describe, it, expect } from 'vitest'
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
      'let httpRequestMessage = new HttpRequestMessage( HttpMethod("GET"), new Uri("https://api.com/"))',
    )
  })

  it('generates correct HttpRequestMessage for POST method', () => {
    const request = { url: 'https://api.com/resource', method: 'POST' } as any
    const result = fsharpHttpclient.generate(request, {})
    expect(result).toContain(
      'let httpRequestMessage = new HttpRequestMessage( HttpMethod("POST"), new Uri("https://api.com/resource"))',
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
      'let httpRequestMessage = new HttpRequestMessage( HttpMethod("GET"), new Uri("https://api.com/data?q=search"))',
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
      'let content = new StringContent("{\\"key\\":\\"value\\"}", Encoding.UTF8, "application/json")',
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
    expect(result).toContain('formUrlEncodedContentDictionary.Add("bar", "foo")')
    expect(result).toContain('formUrlEncodedContentDictionary.Add("qux", "baz")')
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
    expect(result).toContain('content.Add(new StringContent("value1", "field1")')
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
    expect(result).toContain('fileStreamContent_0.Headers.ContentType <- new MediaTypeHeaderValue("text/plain")')
    expect(result).toContain('content.Add(fileStreamContent_0, "file_0", "test.txt")')
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
    expect(result).toContain('content.Add(new StringContent("value1", "field1")')
    expect(result).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead("test.txt"))')
    expect(result).toContain('fileStreamContent_0.Headers.ContentType <- new MediaTypeHeaderValue("text/plain")')
    expect(result).toContain('content.Add(fileStreamContent_0, "file_0", "test.txt")')
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
})
