import { describe, expect, it } from 'vitest'

import { rubyNative } from './native'

describe('rubyNative', () => {
  const baseHttpsRequest = `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body`

  it('returns a basic request', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(baseHttpsRequest)
  })

  it('returns a POST request', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)

response = http.request(request)
puts response.read_body`,
    )
  })

  it('has headers', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["Content-Type"] = 'application/json'

response = http.request(request)
puts response.read_body`,
    )
  })

  it(`doesn't add empty headers`, () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(baseHttpsRequest)
  })

  it('has JSON body', () => {
    const result = rubyNative.generate({
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

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = 'application/json'
request.body = <<~JSON
{
  "hello": "world"
}
JSON

response = http.request(request)
puts response.read_body`,
    )
  })

  it('has query string', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain('url = URI("https://example.com?foo=bar&bar=foo")')
  })

  it('has cookies', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`request["Cookie"] = 'foo=bar; bar=foo'`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(baseHttpsRequest)
  })

  it('adds basic auth credentials', () => {
    const result = rubyNative.generate(
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

    expect(result).toContain(`request.basic_auth("user", "pass")`)
  })

  it('omits auth when not provided', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
    })

    expect(result).not.toContain('request.basic_auth')
  })

  it('omits auth when username is missing', () => {
    const result = rubyNative.generate(
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

    expect(result).not.toContain('request.basic_auth')
  })

  it('omits auth when password is missing', () => {
    const result = rubyNative.generate(
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

    expect(result).not.toContain('request.basic_auth')
  })

  it('handles special characters in auth credentials', () => {
    const result = rubyNative.generate(
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

    expect(result).toContain(`request.basic_auth("user@example.com", "pass:word!")`)
  })

  it('handles undefined auth object', () => {
    const result = rubyNative.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).not.toContain('request.basic_auth')
  })

  it('handles multipart form data with files', () => {
    const result = rubyNative.generate({
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
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
form_data = []
form_data << ['file', File.open('test.txt')]
form_data << ['field', 'value']
request.set_form(form_data, 'multipart/form-data')

response = http.request(request)
puts response.read_body`,
    )
  })

  it('handles multipart form data content types on string parts', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(
      `form_data << ['user', '{"name":"scalar"}', { content_type: 'application/json;charset=utf-8' }]`,
    )
  })

  it('handles multipart form data content types on files', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(
      `form_data << ['file', File.open('test.txt'), { filename: 'test.txt', content_type: 'text/plain' }]`,
    )
  })

  it('handles multipart form data with single quotes in parameter name', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`form_data << ['field\\'name', 'value']`)
    expect(result).toContain(`form_data << ['file\\'name', File.open('test.txt')]`)
  })

  it('handles multipart form data with JSON payload', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`request["Content-Type"] = 'multipart/form-data'`)
    expect(result).toContain(`request.body = "{\\"foo\\":\\"bar\\"}"`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`request.body = 'special%20chars!%40%23=value'`)
  })

  it('handles url-encoded form data with single quotes in parameter name', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`request.body = 'field%27name=value'`)
  })

  it('handles binary data flag', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toContain('request.body = "binary content"')
  })

  it('handles compressed response', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toContain(`request["Accept-Encoding"] = 'gzip, deflate'`)
  })

  it('handles special characters in URL', () => {
    const result = rubyNative.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com/path%20with%20spaces/[brackets]")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body`,
    )
  })

  it('handles multiple headers with same name', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["X-Custom"] = 'value1'
request["X-Custom"] = 'value2'

response = http.request(request)
puts response.read_body`,
    )
  })

  it('handles headers with empty values', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)
request["X-Empty"] = ''

response = http.request(request)
puts response.read_body`,
    )
  })

  it('handles query string parameters', () => {
    const result = rubyNative.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com/api?param1=value1&param2=special%20value&param3=123")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body`,
    )
  })

  it('handles special characters in query parameters', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(
      'url = URI("https://example.com?q=hello%20world%20%26%20more&special=!%40%23%24%25%5E%26*()")',
    )
  })

  it('handles empty URL', () => {
    const result = rubyNative.generate({
      url: '',
    })

    expect(result).toContain('url = URI("")')
    expect(result).not.toContain('http.use_ssl = true')
  })

  it('handles extremely long URLs', () => {
    const result = rubyNative.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toContain(`url = URI("https://example.com/${'a'.repeat(2000)}")`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`form_data << ['file', File.open('')]`)
  })

  it('handles JSON body with special characters', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain(`request["Content-Type"] = 'application/json'`)
    expect(result).toContain('request.body = <<~JSON')
    expect(result).toContain(`"key": "\\"quotes\\" and \\\\backslashes\\\\"`)
  })

  it('handles cookies with special characters', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toContain(`request["Cookie"] = 'special%3Bcookie=value%20with%20spaces'`)
  })

  it('prettifies JSON body', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain('request.body = <<~JSON')
    expect(result).toContain(`"simple": "value"`)
  })

  it('handles URLs with dollar sign characters', () => {
    const result = rubyNative.generate({
      url: 'https://example.com/path$with$dollars',
    })

    expect(result).toContain('url = URI("https://example.com/path$with$dollars")')
  })

  it('handles URLs with dollar signs in query parameters', () => {
    const result = rubyNative.generate({
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

    expect(result).toContain('url = URI("https://example.com?price=%24100&currency=USD%24")')
  })

  it('handles URLs with dollar signs in path and query', () => {
    const result = rubyNative.generate({
      url: 'https://example.com/api$v1/prices',
      queryString: [
        {
          name: 'amount',
          value: '%2450.00',
        },
      ],
    })

    expect(result).toContain('url = URI("https://example.com/api$v1/prices?amount=%2450.00")')
  })

  it('escapes single quotes in JSON body fallback', () => {
    const result = rubyNative.generate({
      url: 'https://editor.scalar.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: "hell'o",
      },
    })

    expect(result).toContain(`request.body = "hell'o"`)
  })

  it('supports custom HTTP methods', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      method: 'PROPFIND',
      postData: {
        mimeType: 'application/json',
        text: '{}',
      },
    })

    expect(result).toContain('class Net::HTTP::Propfind < Net::HTTPRequest')
    expect(result).toContain("METHOD = 'PROPFIND'")
    expect(result).toContain("REQUEST_HAS_BODY = 'true'")
    expect(result).toContain('request = Net::HTTP::Propfind.new(url)')
  })
})
