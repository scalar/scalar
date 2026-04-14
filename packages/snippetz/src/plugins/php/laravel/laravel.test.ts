import { describe, expect, it } from 'vitest'

import { phpLaravel } from './laravel'

describe('phpLaravel', () => {
  it('returns a basic request', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('returns a POST request', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::post('https://example.com');`)
  })

  it('has headers', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Content-Type' => 'application/json'
])
  ->get('https://example.com');`)
  })

  it("doesn't add empty headers", () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('has JSON body', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Content-Type' => 'application/json'
])
  ->post('https://example.com', [
    'hello' => 'world'
  ]);`)
  })

  it('has query string', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com?foo=bar&bar=foo');`)
  })

  it('has cookies', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com/users',
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withCookies([
  'foo' => 'bar',
  'bar' => 'foo'
], 'example.com')
  ->get('https://example.com/users');`)
  })

  it("doesn't add empty cookies", () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('adds basic auth credentials', () => {
    const result = phpLaravel.generate(
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withBasicAuth('user', 'pass')
  ->get('https://example.com');`)
  })

  it('omits auth when not provided', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('omits auth when username is missing', () => {
    const result = phpLaravel.generate(
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('omits auth when password is missing', () => {
    const result = phpLaravel.generate(
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('handles special characters in auth credentials', () => {
    const result = phpLaravel.generate(
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withBasicAuth('user@example.com', 'pass:word!')
  ->get('https://example.com');`)
  })

  it('handles undefined auth object', () => {
    const result = phpLaravel.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com');`)
  })

  it('handles multipart form data with files', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::attach('file', file_get_contents('test.txt'), 'test.txt')
  ->post('https://example.com', [
    'field' => 'value'
  ]);`)
  })

  it('handles multipart form data content types on string parts', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::attach('user', '{"name":"scalar"}', null, [
  'Content-Type' => 'application/json;charset=utf-8'
])
  ->post('https://example.com');`)
  })

  it('handles multipart form data content types on files', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::attach('file', file_get_contents('test.txt'), 'test.txt', [
  'Content-Type' => 'text/plain'
])
  ->post('https://example.com');`)
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::attach('file\\'name', file_get_contents('test.txt'), 'test.txt')
  ->post('https://example.com', [
    'field\\'name' => 'value'
  ]);`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Content-Type' => 'multipart/form-data'
])
  ->post('https://example.com', [
    'foo' => 'bar'
  ]);`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::asForm()
  ->post('https://example.com', [
    'special chars!@#' => 'value'
  ]);`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::asForm()
  ->post('https://example.com', [
    'field\\'name' => 'value'
  ]);`)
  })

  it('handles binary data flag', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withBody('binary content', 'application/octet-stream')
  ->post('https://example.com');`)
  })

  it('passes through compressed response headers', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Accept-Encoding' => 'gzip, deflate'
])
  ->get('https://example.com');`)
  })

  it('handles special characters in URL', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com/path with spaces/[brackets]');`)
  })

  it('handles special characters in query parameters', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()');`)
  })

  it('handles empty URL', () => {
    const result = phpLaravel.generate({
      url: '',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('');`)
  })

  it('handles extremely long URLs', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com/${'a'.repeat(2000)}');`)
  })

  it('handles multiple headers with same name', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'X-Custom' => [
    'value1',
    'value2'
  ]
])
  ->get('https://example.com');`)
  })

  it('handles headers with empty values', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'X-Empty' => ''
])
  ->get('https://example.com');`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::attach('file', file_get_contents(''), '')
  ->post('https://example.com');`)
  })

  it('handles JSON body with special characters', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Content-Type' => 'application/json'
])
  ->post('https://example.com', [
    'key' => '"quotes" and \\\\backslashes\\\\',
    'nested' => [
      'array' => [
        'item1',
        null,
        null
      ]
    ]
  ]);`)
  })

  it('handles cookies with special characters', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withCookies([
  'special;cookie' => 'value with spaces'
], 'example.com')
  ->get('https://example.com');`)
  })

  it('prettifies JSON body', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withHeaders([
  'Content-Type' => 'application/json'
])
  ->post('https://example.com', [
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
  ]);`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com/path$with$dollars');`)
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = phpLaravel.generate({
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

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com?price=%24100&currency=USD%24');`)
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com/api$v1/prices?amount=%2450.00');`)
  })

  it('escapes single quotes in JSON body fallback text', () => {
    const result = phpLaravel.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: `"hell'o" not-json`,
      },
    })

    expect(result).toContain(`withBody('"hell\\'o" not-json', 'application/json')`)
  })

  it('preserves duplicate query parameters', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      queryString: [
        { name: 'statuses', value: 'active' },
        { name: 'statuses', value: 'inactive' },
      ],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::get('https://example.com?statuses=active&statuses=inactive');`)
  })

  it('uses withCookies localhost domain for invalid url', () => {
    const result = phpLaravel.generate({
      url: 'not-a-valid-url',
      cookies: [{ name: 'session', value: 'abc' }],
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::withCookies([
  'session' => 'abc'
], 'localhost')
  ->get('not-a-valid-url');`)
  })

  it('uses send for methods outside direct facade helpers', () => {
    const result = phpLaravel.generate({
      url: 'https://example.com',
      method: 'OPTIONS',
    })

    expect(result).toBe(`use Illuminate\\Support\\Facades\\Http;

$response = Http::send('OPTIONS', 'https://example.com');`)
  })
})
