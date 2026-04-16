import { describe, expect, it } from 'vitest'

import { cLibcurl } from './libcurl'

describe('cLibcurl', () => {
  const expectBaseRequest = (result: string, method: string, url: string): void => {
    expect(result).toContain(`#include <curl/curl.h>`)
    expect(result).toContain(`curl_easy_setopt(curl, CURLOPT_CUSTOMREQUEST, "${method}");`)
    expect(result).toContain(`curl_easy_setopt(curl, CURLOPT_URL, "${url}");`)
    expect(result).toContain(`CURLcode res = curl_easy_perform(curl);`)
    expect(result).toContain(`curl_easy_cleanup(curl);`)
    expect(result).toContain(`curl_global_cleanup();`)
  }

  it('returns a basic request', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
  })

  it('returns a POST request', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expectBaseRequest(result, 'POST', 'https://example.com')
  })

  it('has headers', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })
    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('struct curl_slist *headers = NULL;')
    expect(result).toContain('headers = curl_slist_append(headers, "Content-Type: application/json");')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_HTTPHEADER, headers);')
    expect(result).toContain('curl_slist_free_all(headers);')
  })

  it(`doesn't add empty headers`, () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('struct curl_slist *headers = NULL;')
  })

  it('has JSON body', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\\n  \\"hello\\": \\"world\\"\\n}");')
  })

  it('has query string', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'GET', 'https://example.com?foo=bar&bar=foo')
  })

  it('has cookies', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_COOKIE, "foo=bar; bar=foo");')
  })

  it(`doesn't add empty cookies`, () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('CURLOPT_COOKIE')
  })

  it('adds basic auth credentials', () => {
    const result = cLibcurl.generate(
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

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_USERPWD, "user:pass");')
  })

  it('omits auth when not provided', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('CURLOPT_USERPWD')
  })

  it('omits auth when username is missing', () => {
    const result = cLibcurl.generate(
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

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('CURLOPT_USERPWD')
  })

  it('omits auth when password is missing', () => {
    const result = cLibcurl.generate(
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

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('CURLOPT_USERPWD')
  })

  it('handles special characters in auth credentials', () => {
    const result = cLibcurl.generate(
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

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_USERPWD, "user@example.com:pass:word!");')
  })

  it('handles undefined auth object', () => {
    const result = cLibcurl.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).not.toContain('CURLOPT_USERPWD')
  })

  it('handles multipart form data with files', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_mime *mime = curl_mime_init(curl);')
    expect(result).toContain('curl_mime_name(part, "file");')
    expect(result).toContain('curl_mime_filedata(part, "test.txt");')
    expect(result).toContain('curl_mime_name(part, "field");')
    expect(result).toContain('curl_mime_data(part, "value", CURL_ZERO_TERMINATED);')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_MIMEPOST, mime);')
    expect(result).toContain('curl_mime_free(mime);')
  })

  it('handles multipart form data content types on string parts', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_mime_data(part, "{\\"name\\":\\"scalar\\"}", CURL_ZERO_TERMINATED);')
    expect(result).toContain('curl_mime_type(part, "application/json;charset=utf-8");')
  })

  it('handles multipart form data content types on files', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_mime_filedata(part, "test.txt");')
    expect(result).toContain('curl_mime_type(part, "text/plain");')
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain(`curl_mime_name(part, "field'name");`)
    expect(result).toContain(`curl_mime_name(part, "file'name");`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "{\\n  \\"foo\\": \\"bar\\"\\n}");')
  })

  it('handles url-encoded form data with special characters', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "special+chars%21%40%23=value");')
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain(`curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "field%27name=value");`)
  })

  it('handles binary data flag', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "binary content");')
  })

  it('handles compressed response', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_ACCEPT_ENCODING, "");')
  })

  it('handles special characters in URL', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expectBaseRequest(result, 'GET', 'https://example.com/path%20with%20spaces/[brackets]')
  })

  it('handles special characters in query parameters', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'GET', 'https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()')
  })

  it('handles empty URL', () => {
    const result = cLibcurl.generate({
      url: '',
    })

    expectBaseRequest(result, 'GET', '')
  })

  it('handles extremely long URLs', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expectBaseRequest(result, 'GET', `https://example.com/${'a'.repeat(2000)}`)
  })

  it('handles multiple headers with same name', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('headers = curl_slist_append(headers, "X-Custom: value1");')
    expect(result).toContain('headers = curl_slist_append(headers, "X-Custom: value2");')
  })

  it('handles headers with empty values', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('headers = curl_slist_append(headers, "X-Empty: ");')
  })

  it('handles multipart form data with empty file names', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('curl_mime_filedata(part, "");')
  })

  it('handles JSON body with special characters', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('\\"quotes\\" and \\\\backslashes\\\\')
    expect(result).toContain('\\"item1\\"')
    expect(result).toContain('null')
  })

  it('handles cookies with special characters', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expectBaseRequest(result, 'GET', 'https://example.com')
    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_COOKIE, "special%3Bcookie=value%20with%20spaces");')
  })

  it('prettifies JSON body', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'POST', 'https://example.com')
    expect(result).toContain('\\"nested\\": {')
    expect(result).toContain('\\"array\\": [')
    expect(result).toContain('\\"simple\\": \\"value\\"')
  })

  it('handles URLs with dollar sign characters', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expectBaseRequest(result, 'GET', 'https://example.com/path$with$dollars')
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = cLibcurl.generate({
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

    expectBaseRequest(result, 'GET', 'https://example.com?price=%24100&currency=USD%24')
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expectBaseRequest(result, 'GET', 'https://example.com/api$v1/prices?amount=%2450.00')
  })

  it('handles query string parameters', () => {
    const result = cLibcurl.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expectBaseRequest(result, 'GET', 'https://example.com/api?param1=value1&param2=special%20value&param3=123')
  })

  it('escapes single quotes in JSON body', () => {
    const result = cLibcurl.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: '"hell\'o"',
      },
    })

    expect(result).toContain('curl_easy_setopt(curl, CURLOPT_POSTFIELDS, "\\"hell\'o\\"");')
  })
})
