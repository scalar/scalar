import { describe, expect, it } from 'vitest'
import { pythonPython3 } from './python3'

describe('pythonRequests', () => {
  it('returns a basic request', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('returns a POST request', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("POST", "/")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
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

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

headers = { 'Content-Type': "application/json" }

conn.request("GET", "/", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it(`doesn't add empty headers`, () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
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

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

payload = "{\\"hello\\":\\"world\\"}"

headers = { 'Content-Type': "application/json" }

conn.request("POST", "/", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
  it(`doesn't add empty cookies`, () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
  it('handles multipart form data with multiple files', () => {
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
            name: 'file',
            fileName: 'another.txt',
          },
        ],
      },
    })

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
  it('handles url-encoded form data', () => {
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
  it('handles binary data flag', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  it('handles special characters in URL, square brackets', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/path%20with%20spaces/[brackets]")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('handles special characters in URL, curly brackets', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/path with spaces/{brackets}',
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/path%20with%20spaces/{brackets}")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  /*
  it('handles special characters in query parameters', () => {
    const result = pythonPython3.generate({
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

  /* Do we need to handle this? Other plugins using convertWithHttpSnippetLite don't.
  it('handles empty URL', () => {
    const result = pythonPython3.generate({
      url: '',
    })

    expect(result).toBe(`awaiting implementation`)
  })
  */

  it(`doesn't add a line break for a short URL`, () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('handles extremely long URLs', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

conn.request("GET", "/${'a'.repeat(2000)}")

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('handles multiple headers with same name', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

headers = { 'X-Custom': "value2" }

conn.request("GET", "/", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('handles headers with empty values', () => {
    const result = pythonPython3.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

headers = { 'X-Empty': "" }

conn.request("GET", "/", headers=headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  /*
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

    expect(result).toBe(`(awaiting implementation)`)
  })
  */

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

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

payload = "{\\"key\\":\\"\\\\\\"quotes\\\\\\" and \\\\\\\\backslashes\\\\\\\\\\",\\"nested\\":{\\"array\\":[\\"item1\\",null,null]}}"

headers = { 'Content-Type': "application/json" }

conn.request("POST", "/", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  /*
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
  
      expect(result).toBe(`(awaiting implementation)`)
    })
  */

  /*
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

    expect(result).toBe(`awaiting implementation`)
  })
  */

  it('converts true/false/null to Python syntax', () => {
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
          boolTrue: true,
          boolFalse: false,
          nullValue: null,
          nested: {
            boolArray: [true, false, null],
          },
          nullValue2: null,
        }),
      },
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

payload = "{\\"boolTrue\\":true,\\"boolFalse\\":false,\\"nullValue\\":null,\\"nested\\":{\\"boolArray\\":[true,false,null]},\\"nullValue2\\":null}"

headers = { 'Content-Type': "application/json" }

conn.request("POST", "/", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })

  it('does not replace true/false/null in string literals', () => {
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
          stringWithTrue: 'This string contains true',
          stringWithTrue2: 'aaa   true,   aa',
          array: ['true,', '     true\n', 'true'],
        }),
      },
    })

    expect(result).toBe(`import http.client

conn = http.client.HTTPSConnection("example.com")

payload = "{\\"stringWithTrue\\":\\"This string contains true\\",\\"stringWithTrue2\\":\\"aaa   true,   aa\\",\\"array\\":[\\"true,\\",\\"     true\\\\n\\",\\"true\\"]}"

headers = { 'Content-Type': "application/json" }

conn.request("POST", "/", payload, headers)

res = conn.getresponse()
data = res.read()

print(data.decode("utf-8"))`)
  })
})
