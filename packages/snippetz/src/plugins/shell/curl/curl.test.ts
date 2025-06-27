import { describe, expect, it } from 'vitest'

import { shellCurl } from './curl'

describe('shellCurl', () => {
  it('returns a basic request', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
    })

    expect(result).toBe('curl https://example.com')
  })

  it('returns a POST request', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`curl https://example.com \\
  --request POST`)
  })

  it('has headers', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`curl https://example.com \\
  --header 'Content-Type: application/json'`)
  })

  it(`doesn't add empty headers`, () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe('curl https://example.com')
  })

  it('has JSON body', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{
  "hello": "world"
}'`)
  })

  it('has query string', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl 'https://example.com?foo=bar&bar=foo'`)
  })

  it('has cookies', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --cookie 'foo=bar; bar=foo'`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe('curl https://example.com')
  })

  it('adds basic auth credentials', () => {
    const result = shellCurl.generate(
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

    expect(result).toBe(`curl https://example.com \\
  --user 'user:pass'`)
  })

  it('omits auth when not provided', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
    })

    expect(result).toBe('curl https://example.com')
  })

  it('omits auth when username is missing', () => {
    const result = shellCurl.generate(
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

    expect(result).toBe('curl https://example.com')
  })

  it('omits auth when password is missing', () => {
    const result = shellCurl.generate(
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

    expect(result).toBe('curl https://example.com')
  })

  it('handles special characters in auth credentials', () => {
    const result = shellCurl.generate(
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

    expect(result).toBe(`curl https://example.com \\
  --user 'user@example.com:pass:word!'`)
  })

  it('handles undefined auth object', () => {
    const result = shellCurl.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe('curl https://example.com')
  })

  it('handles multipart form data with files', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --form 'file=@test.txt' \\
  --form 'field=value'`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: multipart/form-data' \\
  --data '{
  "foo": "bar"
}'`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --data-urlencode 'special%20chars!%40%23=value'`)
  })

  it('handles binary data flag', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --data-binary 'binary content'`)
  })

  it('handles compressed response', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`curl https://example.com \\
  --header 'Accept-Encoding: gzip, deflate' \\
  --compressed`)
  })

  it('handles special characters in URL', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`curl 'https://example.com/path with spaces/[brackets]'`)
  })

  it('handles special characters in query parameters', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()'`)
  })

  it('handles empty URL', () => {
    const result = shellCurl.generate({
      url: '',
    })

    expect(result).toBe('curl ')
  })

  it('handles extremely long URLs', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`curl https://example.com/${'a'.repeat(2000)}`)
  })

  it('handles multiple headers with same name', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`curl https://example.com \\
  --header 'X-Custom: value1' \\
  --header 'X-Custom: value2'`)
  })

  it('handles headers with empty values', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`curl https://example.com \\
  --header 'X-Empty: '`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --form 'file=@'`)
  })

  it('handles JSON body with special characters', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{
  "key": "\\"quotes\\" and \\\\backslashes\\\\",
  "nested": {
    "array": [
      "item1",
      null,
      null
    ]
  }
}'`)
  })

  it('handles cookies with special characters', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`curl https://example.com \\
  --cookie 'special%3Bcookie=value%20with%20spaces'`)
  })

  it('prettifies JSON body', () => {
    const result = shellCurl.generate({
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

    expect(result).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{
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
}'`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`curl 'https://example.com/path$with$dollars'`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = shellCurl.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'price',
          value: '$100',
        },
        {
          name: 'currency',
          value: 'USD$',
        },
      ],
    })

    expect(result).toBe(`curl 'https://example.com?price=%24100&currency=USD%24'`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = shellCurl.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '$50.00',
        },
      ],
    })

    expect(result).toBe(`curl 'https://example.com/api$v1/prices?amount=%2450.00'`)
  })
})
