import { describe, expect, it } from 'vitest'

import { jsAxios } from './axios'

const createSnippet = (options: string, setup = ''): string => {
  const setupBlock = setup ? `${setup}\n\n` : ''

  return `import axios from 'axios'

${setupBlock}const options = ${options}

try {
  const { data } = await axios.request(options)
  console.log(data)
} catch (error) {
  console.error(error)
}`
}

describe('jsAxios', () => {
  it('returns a basic request', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('returns a POST request', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'POST',
  url: 'https://example.com'
}`),
    )
  })

  it('adds headers', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  headers: {
    'Content-Type': 'application/json'
  }
}`),
    )
  })

  it('does not add empty headers', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('preserves duplicate headers as arrays', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  headers: {
    'X-Custom': ['value1', 'value2']
  }
}`),
    )
  })

  it('keeps headers with empty values', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  headers: {
    'X-Empty': ''
  }
}`),
    )
  })

  it('adds JSON body', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'POST',
  url: 'https://example.com',
  headers: {
    'Content-Type': 'application/json'
  },
  data: {
    hello: 'world'
  }
}`),
    )
  })

  it('falls back to raw text when JSON parsing fails', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json',
        text: '{"hello"',
      },
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'POST',
  url: 'https://example.com',
  data: '{"hello"'
}`),
    )
  })

  it('adds raw body for unknown mime types', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'hello world',
      },
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'POST',
  url: 'https://example.com',
  data: 'hello world'
}`),
    )
  })

  it('adds query params', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      queryString: [
        { name: 'foo', value: 'bar' },
        { name: 'bar', value: 'foo' },
      ],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  params: {
    foo: 'bar',
    bar: 'foo'
  }
}`),
    )
  })

  it('preserves repeated query params as arrays', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      queryString: [
        { name: 'status', value: 'active' },
        { name: 'status', value: 'inactive' },
      ],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  params: {
    status: ['active', 'inactive']
  }
}`),
    )
  })

  it('adds cookies as Cookie header', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      cookies: [
        { name: 'foo', value: 'bar' },
        { name: 'bar', value: 'foo' },
      ],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  headers: {
    Cookie: 'foo=bar; bar=foo'
  }
}`),
    )
  })

  it('does not add empty cookies', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('merges cookies with existing headers', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      headers: [{ name: 'Accept', value: 'application/json' }],
      cookies: [{ name: 'session', value: 'token' }],
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  headers: {
    Accept: 'application/json',
    Cookie: 'session=token'
  }
}`),
    )
  })

  it('adds basic auth credentials', () => {
    const result = jsAxios.generate(
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

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  auth: {
    username: 'user',
    password: 'pass'
  }
}`),
    )
  })

  it('omits auth when not provided', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('omits auth when username is missing', () => {
    const result = jsAxios.generate(
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

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('omits auth when password is missing', () => {
    const result = jsAxios.generate(
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

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('handles special characters in auth credentials', () => {
    const result = jsAxios.generate(
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

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com',
  auth: {
    username: 'user@example.com',
    password: 'pass:word!'
  }
}`),
    )
  })

  it('handles undefined auth object', () => {
    const result = jsAxios.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com'
}`),
    )
  })

  it('handles multipart form data with files', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: formData
}`,
        `const formData = new FormData()
formData.append('file', new Blob([]), 'test.txt')
formData.append('field', 'value')`,
      ),
    )
  })

  it('handles multipart form data content types on string parts', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: formData
}`,
        `const formData = new FormData()
formData.append('user', new Blob(['{"name":"scalar"}'], { type: 'application/json;charset=utf-8' }))`,
      ),
    )
  })

  it('handles multipart form data content types on files', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: formData
}`,
        `const formData = new FormData()
formData.append('file', new Blob([], { type: 'text/plain' }), 'test.txt')`,
      ),
    )
  })

  it('handles multipart form data with empty file names', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: formData
}`,
        `const formData = new FormData()
formData.append('file', new Blob([]), '')`,
      ),
    )
  })

  it('handles url-encoded form data', () => {
    const result = jsAxios.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'foo',
            value: 'bar',
          },
          {
            name: 'baz',
            value: 'foo',
          },
        ],
      },
    })

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: encodedParams
}`,
        `const encodedParams = new URLSearchParams()
encodedParams.append('foo', 'bar')
encodedParams.append('baz', 'foo')`,
      ),
    )
  })

  it('handles url-encoded form data with special characters', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(
        `{
  method: 'POST',
  url: 'https://example.com',
  data: encodedParams
}`,
        `const encodedParams = new URLSearchParams()
encodedParams.append('special chars!@#', 'value')`,
      ),
    )
  })

  it('handles empty URL', () => {
    const result = jsAxios.generate({
      url: '',
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: ''
}`),
    )
  })

  it('handles extremely long URLs', () => {
    const result = jsAxios.generate({
      url: `https://example.com/${'a'.repeat(2000)}`,
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com/${'a'.repeat(2000)}'
}`),
    )
  })

  it('handles special characters in URL', () => {
    const result = jsAxios.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      createSnippet(`{
  method: 'GET',
  url: 'https://example.com/path with spaces/[brackets]'
}`),
    )
  })

  it('handles JSON body with nested data', () => {
    const result = jsAxios.generate({
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

    expect(result).toBe(
      createSnippet(`{
  method: 'POST',
  url: 'https://example.com',
  data: {
    nested: {
      array: [1, 2, 3],
      object: {
        foo: 'bar'
      }
    },
    simple: 'value'
  }
}`),
    )
  })
})
