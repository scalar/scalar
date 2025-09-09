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

describe('turnPostDataToCode', () => {
  it('returns empty string when postData is falsy', () => {
    expect(httpClientHelpers.turnPostDataToCode(null)).toBe('')
    expect(httpClientHelpers.turnPostDataToCode(undefined)).toBe('')
  })

  it('returns empty string when mimeType is not multipart/form-data', () => {
    const postData = { mimeType: 'application/json', text: '{"key":"value"}' }
    expect(httpClientHelpers.turnPostDataToCode(postData)).toBe('')
  })

  it('handles multipart/form-data with mixed file and non-file fields', () => {
    const postData = {
      mimeType: 'multipart/form-data',
      text: '{"file_1":{"type":"file","text":"BINARY","name":"example.pdf","mimeType":"application/pdf"},"field1":"value1"}',
    }

    const result = httpClientHelpers.turnPostDataToCode(postData)

    expect(result).toContain('// Multipart Form')
    expect(result).toContain('use multipartFormContent = new MultipartFormDataContent()')
    expect(result).toContain('let fileStreamContent_0 = new StreamContent(File.OpenRead("example.pdf"))')
    expect(result).toContain('fileStreamContent_0.Headers.ContentType <- new MediaTypeHeaderValue("application/pdf")')
    expect(result).toContain('multipartFormContent.Add(fileStreamContent_0, "file_0", "example.pdf")')
    expect(result).toContain('multipartFormContent.Add(new StringContent("value1"), "field1")')
    expect(result).toContain('let response = client.PostAsync(client.BaseAddress, multipartFormContent).Result')
  })
})

describe('turnPostDataToCode with url-encoded form data', () => {
  it('handles application/x-www-form-urlencoded with multiple key-value pairs', () => {
    const postData = {
      mimeType: 'application/x-www-form-urlencoded',
      text: 'field1=value1&field2=value2',
    }

    const result = httpClientHelpers.turnPostDataToCode(postData)

    expect(result).toContain('// Url Encode')
    expect(result).toContain('let formUrlEncodedContentDictionary = new Dictionary<string, string>()')
    expect(result).toContain('formUrlEncodedContentDictionary.Add("field1", "value1")')
    expect(result).toContain('formUrlEncodedContentDictionary.Add("field2", "value2")')
    expect(result).toContain(
      'let response = client.PostAsync(client.BaseAddress, new FormUrlEncodedContent(formUrlEncodedContentDictionary)).Result',
    )
  })

  it('handles application/x-www-form-urlencoded with a single key-value pair', () => {
    const postData = {
      mimeType: 'application/x-www-form-urlencoded',
      text: 'username=johndoe',
    }

    const result = httpClientHelpers.turnPostDataToCode(postData)

    expect(result).toContain('formUrlEncodedContentDictionary.Add("username", "johndoe")')
  })
})
