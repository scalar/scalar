import { describe, expect, it } from 'vitest'

import { shellWget } from './wget'

describe('shellWget', () => {
  it('returns a basic request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('returns a POST request', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --output-document \\
  - https://example.com`)
  })

  it('has headers', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Content-Type: application/json' \\
  --output-document \\
  - https://example.com`)
  })

  it(`doesn't add empty headers`, () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('has JSON body', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --header 'Content-Type: application/json' \\
  --body-data '{
  "hello": "world"
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('has query string', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com?foo=bar&bar=foo'`)
  })

  it('has cookies', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Cookie: foo=bar; bar=foo' \\
  --output-document \\
  - https://example.com`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('adds basic auth credentials', () => {
    const result = shellWget.generate(
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --user 'user' \\
  --password 'pass' \\
  --output-document \\
  - https://example.com`)
  })

  it('omits auth when not provided', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('omits auth when username is missing', () => {
    const result = shellWget.generate(
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('omits auth when password is missing', () => {
    const result = shellWget.generate(
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('handles special characters in auth credentials', () => {
    const result = shellWget.generate(
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --user 'user@example.com' \\
  --password 'pass:word!' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles undefined auth object', () => {
    const result = shellWget.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com`)
  })

  it('handles multipart form data with files', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-file='test.txt' \\
  --body-data 'field=value' \\
  --output-document \\
  - https://example.com`)
  })

  it('pretty-prints JSON multipart parts alongside file parts', () => {
    const result = shellWget.generate({
      url: 'https://example.com/widget/v1/widgets',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'multipart/form-data',
        },
      ],
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'filename',
          },
          {
            name: 'props',
            value: '{"name":"","description":"","created_at":null}',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --header 'Content-Type: multipart/form-data' \\
  --body-file='filename' \\
  --body-data 'props={
  "name": "",
  "description": "",
  "created_at": null
}' \\
  --output-document \\
  - https://example.com/widget/v1/widgets`)
  })

  it('leaves non-JSON multipart values untouched when contentType claims JSON', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: 'not json',
            contentType: 'application/json',
          },
        ],
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'props=not json' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'field'\\''name=value' \\
  --body-file='test.txt' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --header 'Content-Type: multipart/form-data' \\
  --body-data '{
  "foo": "bar"
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('pretty-prints multipart parts whose contentType uses a +json suffix', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'props',
            value: '{"a":1}',
            contentType: 'application/vnd.custom+json',
          },
        ],
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'props={
  "a": 1
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-file='' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'special%20chars!%40%23=value' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'field'\\''name=value' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles binary data', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data 'binary content' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles compressed response', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Accept-Encoding: gzip, deflate' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles special characters in URL', () => {
    const result = shellWget.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com/path with spaces/[brackets]'`)
  })

  it('handles special characters in query parameters', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()'`)
  })

  it('handles query string parameters in the URL', () => {
    const result = shellWget.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com/api?param1=value1&param2=special value&param3=123'`)
  })

  it('handles empty URL', () => {
    const result = shellWget.generate({
      url: '',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - `)
  })

  it('handles extremely long URLs', () => {
    const result = shellWget.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - https://example.com/${'a'.repeat(2000)}`)
  })

  it('handles multiple headers with same name', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'X-Custom: value1' \\
  --header 'X-Custom: value2' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles headers with empty values', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'X-Empty: ' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles JSON body with special characters', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --header 'Content-Type: application/json' \\
  --body-data '{
  "key": "\\"quotes\\" and \\\\backslashes\\\\",
  "nested": {
    "array": [
      "item1",
      null,
      null
    ]
  }
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles cookies with special characters', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --header 'Cookie: special%3Bcookie=value%20with%20spaces' \\
  --output-document \\
  - https://example.com`)
  })

  it('prettifies JSON body', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --header 'Content-Type: application/json' \\
  --body-data '{
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
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = shellWget.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com/path$with$dollars'`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = shellWget.generate({
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

    expect(result).toBe(`wget --quiet \\
  --method GET \\
  --output-document \\
  - 'https://example.com?price=%24100&currency=USD%24'`)
  })

  it('pretty-prints --body-data bodies whose mimeType uses a +json suffix', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data '{
  "a": 1
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('pretty-prints --body-data bodies whose mimeType includes a charset parameter', () => {
    const result = shellWget.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    })

    expect(result).toBe(`wget --quiet \\
  --method POST \\
  --body-data '{
  "a": 1
}' \\
  --output-document \\
  - https://example.com`)
  })

  it('escapes single quotes in JSON body', () => {
    const result = shellWget.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toContain(`--body-data '"hell'\\''o"'`)
  })
})
