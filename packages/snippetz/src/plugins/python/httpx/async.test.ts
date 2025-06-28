import { describe, expect, it } from 'vitest'
import { pythonHttpxAsync } from './async'

describe('pythonHttpxAsync', () => {
  it('returns a basic request', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com")`)
  })

  it('returns a POST request', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com")`)
  })

  it('has headers', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        headers={
          "Content-Type": "application/json"
        }
    )`)
  })

  it(`doesn't add empty headers`, () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com")`)
  })

  it('has JSON body', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "hello": "world"
        }
    )`)
  })

  it('has query string', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        params={
          "foo": "bar",
          "bar": "foo"
        }
    )`)
  })

  it('has cookies', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        cookies={
          "foo": "bar",
          "bar": "foo"
        }
    )`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com")`)
  })

  it('adds basic auth credentials', () => {
    const result = pythonHttpxAsync.generate(
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        auth=("user", "pass")
    )`)
  })

  it('handles multipart form data with files', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        files=[
          ("file", open("test.txt", "rb"))
        ],
        data={
          "field": "value"
        }
    )`)
  })

  it('handles multipart form data with multiple files', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        files=[
          ("file", open("test.txt", "rb")),
          ("file", open("another.txt", "rb"))
        ]
    )`)
  })

  it('handles url-encoded form data', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        data={
          "special chars!@#": "value"
        }
    )`)
  })

  it('handles binary data flag', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        data=b"binary content"
    )`)
  })

  it('handles compressed response', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        headers={
          "Accept-Encoding": "gzip, deflate"
        }
    )`)
  })

  it('handles special characters in URL', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get(
        "https://example.com/path with spaces/[brackets]"
    )`)
  })

  it('handles special characters in query parameters', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        params={
          "q": "hello world & more",
          "special": "!@#$%^&*()"
        }
    )`)
  })

  it('handles empty URL', () => {
    const result = pythonHttpxAsync.generate({
      url: '',
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("")`)
  })

  it(`doesn't add a line break for a short URL`, () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com")`)
  })

  it('handles extremely long URLs', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get(
        "https://example.com/${'a'.repeat(2000)}"
    )`)
  })

  it('handles multiple headers with same name', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        headers={
          "X-Custom": "value1"
        }
    )`)
  })

  it('handles headers with empty values', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        headers={
          "X-Empty": ""
        }
    )`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        files=[
          ("file", open("", "rb"))
        ]
    )`)
  })

  it('handles JSON body with special characters', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "key": "\\"quotes\\" and \\\\backslashes\\\\",
          "nested": {
            "array": [
              "item1",
              None,
              None
            ]
          }
        }
    )`)
  })

  it('handles cookies with special characters', () => {
    const result = pythonHttpxAsync.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.get("https://example.com",
        cookies={
          "special;cookie": "value with spaces"
        }
    )`)
  })

  it('prettifies JSON body', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "nested": {
            "array": [
              1,
              2,
              3
            ],
            "object": {
              "foo": "bar"
            }
          },
          "simple": "value"
        }
    )`)
  })

  it('converts true/false/null to Python syntax', () => {
    const result = pythonHttpxAsync.generate({
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
        }),
      },
    })

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "boolTrue": True,
          "boolFalse": False,
          "nullValue": None,
          "nested": {
            "boolArray": [
              True,
              False,
              None
            ]
          }
        }
    )`)
  })

  it('does not replace true/false/null in string literals', () => {
    const result = pythonHttpxAsync.generate({
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

    expect(result).toBe(`with httpx.AsyncClient() as client:
    await client.post("https://example.com",
        headers={
          "Content-Type": "application/json"
        },
        json={
          "stringWithTrue": "This string contains true",
          "stringWithTrue2": "aaa   true,   aa",
          "array": [
            "true,",
            "     true\\n",
            "true"
          ]
        }
    )`)
  })
})
