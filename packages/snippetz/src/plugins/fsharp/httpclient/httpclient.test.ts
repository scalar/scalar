import { describe, it, expect } from 'vitest'
import { httpClientHelpers } from './httpclient.helpers'

describe('extractHeaders', () => {
  it('returns an object with header names and values', () => {
    const result = httpClientHelpers.extractHeaders([
      { name: 'Content-Type', value: 'application/json' },
      { name: 'Accept', value: 'application/xml' },
    ])
    expect(result).toEqual({
      'Content-Type': 'application/json',
      'Accept': 'application/xml',
    })
  })

  it('handles multiple headers with the same name', () => {
    const result = httpClientHelpers.extractHeaders([
      { name: 'X-Test', value: 'one' },
      { name: 'X-Test', value: 'two' },
    ])
    expect(result).toEqual({
      'X-Test': ['one', 'two'],
    })
  })

  it('handles empty header array', () => {
    expect(httpClientHelpers.extractHeaders([])).toEqual({})
  })
})

describe('extractQueryString', () => {
  it('returns an object with query param names and values', () => {
    const result = httpClientHelpers.extractQueryString([
      { name: 'foo', value: 'bar' },
      { name: 'baz', value: 'qux' },
    ])
    expect(result).toEqual({
      foo: 'bar',
      baz: 'qux',
    })
  })

  it('handles empty query string array', () => {
    expect(httpClientHelpers.extractQueryString([])).toEqual({})
  })
})

describe('extractCookies', () => {
  it('returns an object with cookie names and values', () => {
    const result = httpClientHelpers.extractCookies([
      { name: 'session', value: 'abc123' },
      { name: 'user', value: 'def456' },
    ])
    expect(result).toEqual({
      session: 'abc123',
      user: 'def456',
    })
  })

  it('handles empty cookies array', () => {
    expect(httpClientHelpers.extractCookies([])).toEqual({})
  })
})

describe('turnCookiesToCode', () => {
  it('generates F# code for a single cookie', () => {
    const cookies = { session: 'abc123' }
    const url = 'https://example.com'
    const code = httpClientHelpers.turnCookiesToCode(cookies, url)
    expect(code).toContain('// Cookies')
    expect(code).toContain('let cookieContainer = new CookieContainer()')
    expect(code).toContain(`cookieContainer.Add("${url}", Cookie("session", "abc123"))`)
    expect(code).toContain('use handler = new HttpClientHandler()')
    expect(code).toContain('handler.CookieContainer <- cookieContainer')
    expect(code).toContain('let client = new HttpClient(handler)')
  })

  it('generates F# code for multiple cookies', () => {
    const cookies = { session: 'abc123', user: 'wesley' }
    const url = 'https://foo.com'
    const code = httpClientHelpers.turnCookiesToCode(cookies, url)
    expect(code).toContain(`cookieContainer.Add("${url}", Cookie("session", "abc123"))`)
    expect(code).toContain(`cookieContainer.Add("${url}", Cookie("user", "wesley"))`)
  })

  it('handles empty cookies object', () => {
    const cookies = {}
    const url = 'https://bar.com'
    const code = httpClientHelpers.turnCookiesToCode(cookies, url)
    expect(code).toContain('let cookieContainer = new CookieContainer()')
    // Should not add any cookies
    expect(code).not.toMatch(/cookieContainer\.Add/)
  })
})

describe('turnHeadersToCode', () => {
  it('generates F# code for a single header', () => {
    const headers = { 'Content-Type': 'application/json' }
    const code = httpClientHelpers.turnHeadersToCode(headers)
    expect(code).toContain('// Headers')
    expect(code).toContain('client.DefaultRequestHeaders.Add("Content-Type", application/json)')
  })

  it('generates F# code for multiple headers', () => {
    const headers = { 'Accept': 'application/xml', 'X-Test': 'foo' }
    const code = httpClientHelpers.turnHeadersToCode(headers)
    expect(code).toContain('client.DefaultRequestHeaders.Add("Accept", application/xml)')
    expect(code).toContain('client.DefaultRequestHeaders.Add("X-Test", foo)')
  })

  it('handles empty headers object', () => {
    const headers = {}
    const code = httpClientHelpers.turnHeadersToCode(headers)
    expect(code).toContain('// Headers')
    // Should not add any headers
    expect(code).not.toMatch(/client\.DefaultRequestHeaders\.Add/)
  })
})

describe('turnQueryStringToCode', () => {
  it('generates F# code for a single query param', () => {
    const query = { foo: 'bar' }
    const url = 'https://example.com'
    const code = httpClientHelpers.turnQueryStringToCode(query, url)
    expect(code).toContain('// QueryString')
    expect(code).toContain('client.BaseAddress <- Uri("https://example.com?foo=bar")\n')
  })

  it('generates F# code for multiple query params', () => {
    const query = { foo: 'bar', baz: 'qux' }
    const url = 'https://api.com'
    const code = httpClientHelpers.turnQueryStringToCode(query, url)
    expect(code).toContain('// QueryString')
    expect(code).toContain('client.BaseAddress <- Uri("https://api.com?foo=bar&baz=qux")\n')
  })

  it('handles empty query object', () => {
    const query = {}
    const url = 'https://empty.com'
    const code = httpClientHelpers.turnQueryStringToCode(query, url)
    expect(code).toContain('// QueryString')
    expect(code).toContain('client.BaseAddress <- Uri("https://empty.com")\n')
  })
})

describe('turnPostDataUrlEncodeToCode', () => {
  it('generates F# code for a single form param', () => {
    const postData = {
      mimeType: 'application/x-www-form-urlencoded',
      params: [{ name: 'foo', value: 'bar' }],
    }
    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('let formUrlEncodedContentDictionary = new Dictionary<string, string>()')
    expect(code).toContain('formUrlEncodedContentDictionary.Add("bar", "foo")')
    expect(code).toContain(
      'let response = client.PostAsync(client.BaseAddress, new FormUrlEncodedContent(formUrlEncodedContentDictionary)).Result',
    )
  })

  it('generates F# code for multiple form params', () => {
    const postData = {
      mimeType: 'application/x-www-form-urlencoded',
      params: [
        { name: 'foo', value: 'bar' },
        { name: 'baz', value: 'qux' },
      ],
    }
    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('let formUrlEncodedContentDictionary = new Dictionary<string, string>()')
    expect(code).toContain('formUrlEncodedContentDictionary.Add("bar", "foo")')
    expect(code).toContain('formUrlEncodedContentDictionary.Add("qux", "baz")')
    expect(code).toContain(
      'let response = client.PostAsync(client.BaseAddress, new FormUrlEncodedContent(formUrlEncodedContentDictionary)).Result',
    )
  })
})

describe('turnPostDataMultiPartToCode', () => {
  it('generates F# code for a single file param', () => {
    const postData = {
      mimeType: 'multipart/form-data',
      params: [{ name: 'file1', value: 'BINARY', fileName: 'test.txt', contentType: 'text/plain' }],
    }

    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead("test.txt"))')
    expect(code).toContain('fileStreamContent_0.Headers.ContentType <- new MediaTypeHeaderValue("text/plain")')
    expect(code).toContain('multipartFormContent.Add(fileStreamContent_0, "file_0", "test.txt")')
    expect(code).toContain('let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result')
  })

  it('generates F# code for a multipart param that is not binary (string field)', () => {
    const postData = {
      mimeType: 'multipart/form-data',
      params: [{ name: 'desc', value: 'hello' }],
    }

    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('multipartFormContent.Add(new StringContent("hello", "desc")')
    expect(code).toContain('let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result')
  })

  it('handles multipart/form-data with no params property', () => {
    const postData = {
      mimeType: 'multipart/form-data',
      params: [],
    }

    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('use multipartFormContent = new MultipartFormDataContent()')
    expect(code).toContain('let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result')
  })
})

describe('turnPostDataJsonToCode', () => {
  it('generates F# code for JSON post data', () => {
    const postData = {
      mimeType: 'application/json',
      text: '{"foo":"bar"}',
    }

    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain(
      'let content = new StringContent("{\\"foo\\":\\"bar\\"}", Encoding.UTF8, "application/json")',
    )
    expect(code).toContain('content.Headers.ContentType <- new MediaTypeHeaderValue("application/json")')
    expect(code).toContain('let response = client.PostAsync(client.BaseAddress, content).Result')
  })

  it('escapes quotes and backslashes in JSON', () => {
    const postData = {
      mimeType: 'application/json',
      text: '{"path":"C:\\\\test\\\\file.txt","msg":"He said \\"hi\\""}',
    }

    const code = httpClientHelpers.turnPostDataToCode(postData)
    expect(code).toContain('\\"path\\":\\"C:\\\\\\\\test\\\\\\\\file.txt\\"')
    expect(code).toContain('\\"msg\\":\\"He said \\\\\\"hi\\\\\\"\\"')
  })
})
