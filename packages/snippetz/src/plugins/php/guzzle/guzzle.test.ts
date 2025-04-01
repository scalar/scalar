import { describe, expect, it } from 'vitest'

import { phpGuzzle } from './guzzle'

describe('phpGuzzle', () => {
  it('returns a basic request', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('returns a POST request', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com');`)
  })

  it('has headers', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'headers' => [
        'Content-Type' => 'application/json',
    ],
]);`)
  })

  it("doesn't add empty headers", () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('has JSON body with PHP array', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'headers' => [
        'Content-Type' => 'application/json',
    ],
    'json' => [
        'hello' => 'world',
    ],
]);`)
  })

  it('has query string', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'query' => [
        'foo' => 'bar',
        'bar' => 'foo',
    ],
]);`)
  })

  it('has cookies', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'cookies' => [
        'foo' => 'bar',
        'bar' => 'foo',
    ],
]);`)
  })

  it("doesn't add empty cookies", () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('adds basic auth credentials', () => {
    const result = phpGuzzle.generate(
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'auth' => [
        'user',
        'pass',
    ],
]);`)
  })

  it('omits auth when not provided', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('omits auth when username is missing', () => {
    const result = phpGuzzle.generate(
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('omits auth when password is missing', () => {
    const result = phpGuzzle.generate(
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('handles special characters in auth credentials', () => {
    const result = phpGuzzle.generate(
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'auth' => [
        'user@example.com',
        'pass:word!',
    ],
]);`)
  })

  it('handles undefined auth object', () => {
    const result = phpGuzzle.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com');`)
  })

  it('handles multipart form data with files', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'multipart' => [
        [
            'name' => 'file',
            'contents' => fopen('test.txt', 'r'),
        ],
        [
            'name' => 'field',
            'contents' => 'value',
        ],
    ],
]);`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'headers' => [
        'Content-Type' => 'multipart/form-data',
    ],
    'form_params' => [
        'foo' => 'bar',
    ],
]);`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'form_params' => [
        'special chars!@#' => 'value',
    ],
]);`)
  })

  it('handles binary data flag', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'body' => 'binary content',
]);`)
  })

  it('handles compressed response', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'headers' => [
        'Accept-Encoding' => 'gzip, deflate',
    ],
    'decode_content' => true,
]);`)
  })

  it('handles special characters in URL', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com/path with spaces/[brackets]');`)
  })

  it('handles special characters in query parameters', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'query' => [
        'q' => 'hello world & more',
        'special' => '!@#$%^&*()',
    ],
]);`)
  })

  it('handles empty URL', () => {
    const result = phpGuzzle.generate({
      url: '',
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', '');`)
  })

  it('handles extremely long URLs', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com/${'a'.repeat(2000)}');`)
  })

  it('handles multiple headers with same name', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'headers' => [
        'X-Custom' => [
            'value1',
            'value2',
        ],
    ],
]);`)
  })

  it('handles headers with empty values', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'headers' => [
        'X-Empty' => '',
    ],
]);`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'multipart' => [
        [
            'name' => 'file',
            'contents' => '',
        ],
    ],
]);`)
  })

  it('handles JSON body with special characters using PHP array', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'headers' => [
        'Content-Type' => 'application/json',
    ],
    'json' => [
        'key' => '"quotes" and \\backslashes\\',
        'nested' => [
            'array' => [
                'item1',
                null,
                null,
            ],
        ],
    ],
]);`)
  })

  it('handles cookies with special characters', () => {
    const result = phpGuzzle.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('GET', 'https://example.com', [
    'cookies' => [
        'special;cookie' => 'value with spaces',
    ],
]);`)
  })

  it('prettifies JSON body using PHP array', () => {
    const result = phpGuzzle.generate({
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

    expect(result).toBe(`$client = new GuzzleHttp\\Client();

$response = $client->request('POST', 'https://example.com', [
    'headers' => [
        'Content-Type' => 'application/json',
    ],
    'json' => [
        'nested' => [
            'array' => [
                1,
                2,
                3,
            ],
            'object' => [
                'foo' => 'bar',
            ],
        ],
        'simple' => 'value',
    ],
]);`)
  })
})
