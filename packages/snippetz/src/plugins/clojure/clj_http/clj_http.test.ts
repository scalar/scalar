import { describe, expect, it } from 'vitest'

import { clojureCljhttp } from './clj_http'

const REQUIRE = `(require '[clj-http.client :as client])`

describe('clojureCljhttp', () => {
  it('returns a basic request', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('returns a POST request', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com")`)
  })

  it('has headers', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:Content-Type "application/json"}})`)
  })

  it(`doesn't add empty headers`, () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('has JSON body', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:content-type :json
                                    :form-params {:hello "world"}})`)
  })

  it('has query string', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:query-params {:foo "bar"
                                                  :bar "foo"}})`)
  })

  it('handles query string parameters from the URL', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com/api" {:query-params {:param1 "value1"
                                                      :param2 "special value"
                                                      :param3 "123"}})`)
  })

  it('has cookies', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:Cookie "foo=bar; bar=foo"}})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('handles cookies with special characters', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      cookies: [
        {
          name: 'special;cookie',
          value: 'value with spaces',
        },
      ],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:Cookie "special%3Bcookie=value%20with%20spaces"}})`)
  })

  it('adds basic auth credentials', () => {
    const result = clojureCljhttp.generate(
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:basic-auth ["user" "pass"]})`)
  })

  it('omits auth when not provided', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('omits auth when username is missing', () => {
    const result = clojureCljhttp.generate(
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('omits auth when password is missing', () => {
    const result = clojureCljhttp.generate(
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('handles special characters in auth credentials', () => {
    const result = clojureCljhttp.generate(
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

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:basic-auth ["user@example.com" "pass:word!"]})`)
  })

  it('handles undefined auth object', () => {
    const result = clojureCljhttp.generate(
      {
        url: 'https://example.com',
      },
      {
        auth: undefined,
      },
    )

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com")`)
  })

  it('handles multipart form data with files', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:multipart [{:name "file"
                                                 :content (clojure.java.io/file "test.txt")} {:name "field"
                                                 :content "value"}]})`)
  })

  it('handles multipart form data with empty file names', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:multipart [{:name "file"
                                                 :content (clojure.java.io/file "")}]})`)
  })

  it('escapes backslashes and quotes in multipart file paths', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'file',
            fileName: 'C:\\path\\to\\"file".txt',
          },
        ],
      },
    })

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:multipart [{:name "file"
                                                 :content (clojure.java.io/file "C:\\\\path\\\\to\\\\\\"file\\".txt")}]})`)
  })

  it('handles url-encoded form data with special characters', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:form-params {:special chars!@# "value"}})`)
  })

  it('handles binary data as a raw body', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:body "binary content"})`)
  })

  it('sends a plain text body', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'text/plain',
        },
      ],
      postData: {
        mimeType: 'text/plain',
        text: 'hello world',
      },
    })

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:body "hello world"})`)
  })

  it('maps an Accept header to the :accept option', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:accept :json})`)
  })

  it('keeps an Accept-Encoding header untouched', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Accept-Encoding',
          value: 'gzip, deflate',
        },
      ],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:Accept-Encoding "gzip, deflate"}})`)
  })

  it('handles special characters in URL', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com/path%20with%20spaces/[brackets]")`)
  })

  it('handles multiple headers with the same name', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:X-Custom "value2"}})`)
  })

  it('handles headers with empty values', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com" {:headers {:X-Empty ""}})`)
  })

  it('handles JSON body with special characters', () => {
    const result = clojureCljhttp.generate({
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

    expect(result).toBe(`${REQUIRE}

(client/post "https://example.com" {:content-type :json
                                    :form-params {:key "\\"quotes\\" and \\\\backslashes\\\\"
                                                  :nested {:array ["item1" nil nil]}}})`)
  })

  it('handles extremely long URLs', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com/' + 'a'.repeat(2000),
    })

    expect(result).toBe(`${REQUIRE}

(client/get "https://example.com/${'a'.repeat(2000)}")`)
  })
})
