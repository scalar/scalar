import { describe, expect, it } from 'vitest'

import { curl } from './curl'

describe('curl', () => {
  it('returns a basic request', () => {
    const source = curl({
      url: 'https://example.com',
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('returns a POST request', () => {
    const source = curl({
      url: 'https://example.com',
      method: 'post',
    })

    expect(source.code).toBe(`curl https://example.com \\
  --request POST`)
  })

  it('has headers', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(source.code).toBe(`curl https://example.com \\
  --header 'Content-Type: application/json'`)
  })

  it('doesn’t add empty headers', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [],
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('has JSON body', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{"hello":"world"}'`)
  })

  it('has query string', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl 'https://example.com?foo=bar&bar=foo'`)
  })

  it('has cookies', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --cookie 'foo=bar; bar=foo'`)
  })

  it('doesn’t add empty cookies', () => {
    const source = curl({
      url: 'https://example.com',
      cookies: [],
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('adds basic auth credentials', () => {
    const source = curl(
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

    expect(source.code).toBe(`curl https://example.com \\
  --user 'user:pass'`)
  })

  it('omits auth when not provided', () => {
    const source = curl({
      url: 'https://example.com',
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('omits auth when username is missing', () => {
    const source = curl(
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

    expect(source.code).toBe('curl https://example.com')
  })

  it('omits auth when password is missing', () => {
    const source = curl(
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

    expect(source.code).toBe('curl https://example.com')
  })

  it('handles special characters in auth credentials', () => {
    const source = curl(
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

    expect(source.code).toBe(`curl https://example.com \\
  --user 'user@example.com:pass:word!'`)
  })

  it('handles undefined auth object', () => {
    const source = curl(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(source.code).toBe('curl https://example.com')
  })

  it('handles multipart form data with files', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --form 'file=@test.txt' \\
  --form 'field=value'`)
  })

  it('handles url-encoded form data with special characters', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --data-urlencode 'special%20chars!%40%23=value'`)
  })

  it('handles binary data flag', () => {
    const source = curl({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --data-binary 'binary content'`)
  })

  it('handles compressed response', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(source.code).toBe(`curl https://example.com \\
  --header 'Accept-Encoding: gzip, deflate' \\
  --compressed`)
  })

  it('handles special characters in URL', () => {
    const source = curl({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(source.code).toBe(
      `curl 'https://example.com/path with spaces/[brackets]'`,
    )
  })

  it('handles special characters in query parameters', () => {
    const source = curl({
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

    expect(source.code).toBe(
      `curl 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()'`,
    )
  })

  it('handles empty URL', () => {
    const source = curl({
      url: '',
    })

    expect(source.code).toBe('curl ')
  })

  it('handles extremely long URLs', () => {
    const source = curl({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(source.code).toBe(`curl https://example.com/${'a'.repeat(2000)}`)
  })

  it('handles multiple headers with same name', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(source.code).toBe(`curl https://example.com \\
  --header 'X-Custom: value1' \\
  --header 'X-Custom: value2'`)
  })

  it('handles headers with empty values', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(source.code).toBe(`curl https://example.com \\
  --header 'X-Empty: '`)
  })

  it('handles multipart form data with empty file names', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --form 'file=@'`)
  })

  it('handles JSON body with special characters', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{"key":"\\"quotes\\" and \\\\backslashes\\\\","nested":{"array":["item1",null,null]}}'`)
  })

  it('handles cookies with special characters', () => {
    const source = curl({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(source.code).toBe(`curl https://example.com \\
  --cookie 'special%3Bcookie=value%20with%20spaces'`)
  })
})
