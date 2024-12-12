import { describe, expect, it } from 'vitest'

import { rubyNative } from './native'

describe('rubyNative', () => {
  it('returns a basic request', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Get.new(url)

response = http.request(request)
puts response.read_body`,
    )
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

response = http.request(request)
puts response.read_body`,
    )
  })

  it.skip('handles url-encoded form data with special characters', () => {
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

    expect(result).toBe(
      `require 'uri'
require 'net/http'

url = URI("https://example.com")

http = Net::HTTP.new(url.host, url.port)
http.use_ssl = true

request = Net::HTTP::Post.new(url)
request["Content-Type"] = "application/x-www-form-urlencoded"

response = http.request(request)
puts response.read_body`,
    )
  })

  it.skip('handles binary data', () => {
    const result = rubyNative.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
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
})
