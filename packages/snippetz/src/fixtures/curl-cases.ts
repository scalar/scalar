import type { HarRequest, PluginConfiguration } from '@scalar/types/snippetz'

/** The curl regression cases also define the minimum coverage for replacement plugins. */
export const curlCases = [
  {
    name: 'returns a basic request',
    request: {
      url: 'https://example.com',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'returns a POST request',
    request: {
      url: 'https://example.com',
      method: 'post',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST`,
  },
  {
    name: 'has headers',
    request: {
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --header 'Content-Type: application/json'`,
  },
  {
    name: `doesn't add empty headers`,
    request: {
      url: 'https://example.com',
      headers: [],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'has JSON body',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --header 'Content-Type: application/json' \\
  --data '{
  "hello": "world"
}'`,
  },
  {
    name: 'has query string',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com?foo=bar&bar=foo'`,
  },
  {
    name: 'joins query string parameters with & when the URL already has a query string',
    request: {
      url: 'https://example.com/api?existing=1',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com/api?existing=1&foo=bar'`,
  },
  {
    name: 'quotes a URL whose query string has no other special characters',
    request: {
      url: 'https://example.com/api?param1=value1&param2=value2',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com/api?param1=value1&param2=value2'`,
  },
  {
    name: 'has cookies',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --cookie 'foo=bar; bar=foo'`,
  },
  {
    name: `doesn't add empty cookies`,
    request: {
      url: 'https://example.com',
      cookies: [],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'adds basic auth credentials',
    request: {
      url: 'https://example.com',
    },
    configuration: {
      auth: {
        username: 'user',
        password: 'pass',
      },
    },
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --user 'user:pass'`,
  },
  {
    name: 'omits auth when not provided',
    request: {
      url: 'https://example.com',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'omits auth when username is missing',
    request: {
      url: 'https://example.com',
    },
    configuration: {
      auth: {
        username: '',
        password: 'pass',
      },
    },
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'omits auth when password is missing',
    request: {
      url: 'https://example.com',
    },
    configuration: {
      auth: {
        username: 'user',
        password: '',
      },
    },
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'handles special characters in auth credentials',
    request: {
      url: 'https://example.com',
    },
    configuration: {
      auth: {
        username: 'user@example.com',
        password: 'pass:word!',
      },
    },
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --user 'user@example.com:pass:word!'`,
  },
  {
    name: 'handles undefined auth object',
    request: {
      url: 'https://example.com',
    },
    configuration: {
      auth: undefined,
    },
    matcher: 'toBe',
    expectedCurl: 'curl https://example.com',
  },
  {
    name: 'handles multipart form data with files',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'file=@test.txt' \\
  --form 'field=value'`,
  },
  {
    name: 'handles multipart form data content types on string parts',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'user={
  "name": "scalar"
};type=application/json;charset=utf-8'`,
  },
  {
    name: 'pretty-prints JSON multipart parts alongside file parts',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com/widget/v1/widgets \\
  --request POST \\
  --header 'Content-Type: multipart/form-data' \\
  --form 'file=@filename' \\
  --form 'props={
  "name": "",
  "description": "",
  "created_at": null
};type=application/json'`,
  },
  {
    name: 'leaves non-JSON multipart values untouched when contentType claims JSON',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'props=not json;type=application/json'`,
  },
  {
    name: 'handles multipart form data content types on files',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'file=@test.txt;type=text/plain'`,
  },
  {
    name: 'handles multipart form data with single quotes in parameter name',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'field'\\''name=value' \\
  --form 'file'\\''name=@test.txt'`,
  },
  {
    name: 'handles multipart form data with JSON payload',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --header 'Content-Type: multipart/form-data' \\
  --data '{
  "foo": "bar"
}'`,
  },
  {
    name: 'handles url-encoded form data with special characters',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --data-urlencode 'special%20chars!%40%23=value'`,
  },
  {
    name: 'handles url-encoded form data with single quotes in parameter name',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --data-urlencode 'field'\\''name=value'`,
  },
  {
    name: 'handles binary data flag',
    request: {
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --data-binary 'binary content'`,
  },
  {
    name: 'handles compressed response',
    request: {
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --header 'Accept-Encoding: gzip, deflate' \\
  --compressed`,
  },
  {
    name: 'handles special characters in URL',
    request: {
      url: 'https://example.com/path with spaces/[brackets]',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com/path with spaces/[brackets]' \\
  --globoff`,
  },
  {
    name: 'handles special characters in query parameters',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()'`,
  },
  {
    name: 'handles empty URL',
    request: {
      url: '',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: 'curl ',
  },
  {
    name: 'handles extremely long URLs',
    request: {
      url: 'https://example.com/' + 'a'.repeat(2000),
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com/${'a'.repeat(2000)}`,
  },
  {
    name: 'handles multiple headers with same name',
    request: {
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --header 'X-Custom: value1' \\
  --header 'X-Custom: value2'`,
  },
  {
    name: 'handles headers with empty values',
    request: {
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --header 'X-Empty: '`,
  },
  {
    name: 'handles multipart form data with empty file names',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'file=@'`,
  },
  {
    name: 'handles JSON body with special characters',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
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
}'`,
  },
  {
    name: 'handles cookies with special characters',
    request: {
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --cookie 'special%3Bcookie=value%20with%20spaces'`,
  },
  {
    name: 'prettifies JSON body',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
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
}'`,
  },
  {
    name: 'handles URLs with dollar sign characters',
    request: {
      url: 'https://example.com/path$with$dollars',
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com/path$with$dollars'`,
  },
  {
    name: 'handles URLs with dollar signs in query parameters',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com?price=%24100&currency=USD%24'`,
  },
  {
    name: 'handles URLs with dollar signs in path and query',
    request: {
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl 'https://example.com/api$v1/prices?amount=%2450.00'`,
  },
  {
    name: 'pretty-prints --data bodies whose mimeType uses a +json suffix',
    request: {
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/vnd.api+json',
        text: JSON.stringify({ a: 1 }),
      },
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --data '{
  "a": 1
}'`,
  },
  {
    name: 'pretty-prints --data bodies whose mimeType includes a charset parameter',
    request: {
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/json;charset=utf-8',
        text: JSON.stringify({ a: 1 }),
      },
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --data '{
  "a": 1
}'`,
  },
  {
    name: 'pretty-prints --form parts whose contentType uses a +json suffix',
    request: {
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
    },
    configuration: undefined,
    matcher: 'toBe',
    expectedCurl: `curl https://example.com \\
  --request POST \\
  --form 'props={
  "a": 1
};type=application/vnd.custom+json'`,
  },
  {
    name: 'escapes single quotes in JSON body',
    request: {
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    },
    configuration: undefined,
    matcher: 'toContain',
    expectedCurl: `--data '"hell'\\''o"'`,
  },
] satisfies {
  name: string
  request: Partial<HarRequest>
  configuration?: PluginConfiguration
  matcher: 'toBe' | 'toContain'
  expectedCurl: string
}[]
