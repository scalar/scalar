import { describe, expect, it } from 'vitest'

import { phpCurl } from './curl'

describe('phpCurl', () => {
  it('returns a basic request', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('returns a POST request', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);

curl_exec($ch);

curl_close($ch);`)
  })

  it('has headers', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);

curl_exec($ch);

curl_close($ch);`)
  })

  it("doesn't add empty headers", () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('has JSON body with PHP array', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'hello' => 'world'
]));

curl_exec($ch);

curl_close($ch);`)
  })

  it('has query string', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com?foo=bar&bar=foo");

curl_exec($ch);

curl_close($ch);`)
  })

  it('has cookies', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_COOKIE, 'foo=bar; bar=foo');

curl_exec($ch);

curl_close($ch);`)
  })

  it("doesn't add empty cookies", () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('adds basic auth credentials', () => {
    const result = phpCurl.generate(
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_USERPWD, 'user:pass');

curl_exec($ch);

curl_close($ch);`)
  })

  it('omits auth when not provided', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('omits auth when username is missing', () => {
    const result = phpCurl.generate(
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('omits auth when password is missing', () => {
    const result = phpCurl.generate(
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles special characters in auth credentials', () => {
    const result = phpCurl.generate(
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_USERPWD, 'user@example.com:pass:word!');

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles undefined auth object', () => {
    const result = phpCurl.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles multipart form data with files', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: multipart/form-data']);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => '@test.txt', 'field' => 'value']);

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: multipart/form-data']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'foo' => 'bar'
]));

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/x-www-form-urlencoded']);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'special%20chars!%40%23=value');

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles binary data flag', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/octet-stream']);
curl_setopt($ch, CURLOPT_POSTFIELDS, 'binary content');

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles compressed response', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_HTTPHEADER, ['Accept-Encoding: gzip, deflate']);
curl_setopt($ch, CURLOPT_ENCODING, '');

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles special characters in URL', () => {
    const result = phpCurl.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`$ch = curl_init("https://example.com/path with spaces/[brackets]");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles special characters in query parameters', () => {
    const result = phpCurl.generate({
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

    expect(
      result,
    ).toBe(`$ch = curl_init("https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles empty URL', () => {
    const result = phpCurl.generate({
      url: '',
    })

    expect(result).toBe(`$ch = curl_init("");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles extremely long URLs', () => {
    const result = phpCurl.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`$ch = curl_init("https://example.com/${'a'.repeat(2000)}");

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles multiple headers with same name', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-Custom: value1', 'X-Custom: value2']);

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles headers with empty values', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_HTTPHEADER, ['X-Empty: ']);

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: multipart/form-data']);
curl_setopt($ch, CURLOPT_POSTFIELDS, ['file' => '@']);

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles JSON body with special characters using PHP array', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'key' => '"quotes" and \\backslashes\\',
  'nested' => [
    'array' => [
      'item1',
      null,
      null
    ]
  ]
]));

curl_exec($ch);

curl_close($ch);`)
  })

  it('handles cookies with special characters', () => {
    const result = phpCurl.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_COOKIE, 'special%3Bcookie=value%20with%20spaces');

curl_exec($ch);

curl_close($ch);`)
  })

  it('prettifies JSON body using PHP array', () => {
    const result = phpCurl.generate({
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

    expect(result).toBe(`$ch = curl_init("https://example.com");

curl_setopt($ch, CURLOPT_POST, true);
curl_setopt($ch, CURLOPT_HTTPHEADER, ['Content-Type: application/json']);
curl_setopt($ch, CURLOPT_POSTFIELDS, json_encode([
  'nested' => [
    'array' => [
      1,
      2,
      3
    ],
    'object' => [
      'foo' => 'bar'
    ]
  ],
  'simple' => 'value'
]));

curl_exec($ch);

curl_close($ch);`)
  })
})
