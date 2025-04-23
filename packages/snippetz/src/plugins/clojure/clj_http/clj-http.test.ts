import { describe, expect, it } from 'vitest'

import { clojureCljhttp } from './clj_http'

describe('clojureCljhttp', () => {
  it('returns a basic request', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com")`,
    )
  })

  it('returns a POST request', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/post "https://example.com")`,
    )
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
    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com" {:headers {:Content-Type "application/json"}})`,
    )
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

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/post "https://example.com" {:multipart [{:name "file"
                                                 :content (clojure.java.io/file "test.txt")} {:name "field"
                                                 :content "value"}]})`,
    )
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

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/post "https://example.com" {:form-params {:special chars!@# "value"}})`,
    )
  })

  it.skip('handles binary data', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/octet-stream',
        text: 'binary content',
      },
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/post "https://example.com" {:body "binary content"
                                   :content-type :application/octet-stream})`,
    )
  })

  it('handles special characters in URL', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com/path with spaces/[brackets]',
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com/path%20with%20spaces/[brackets]")`,
    )
  })

  it('handles multiple headers with same name', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [
        { name: 'X-Custom', value: 'value1' },
        { name: 'X-Custom', value: 'value2' },
      ],
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com" {:headers {:X-Custom "value2"}})`,
    )
  })

  it('handles headers with empty values', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com',
      headers: [{ name: 'X-Empty', value: '' }],
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com" {:headers {:X-Empty ""}})`,
    )
  })

  it('handles query string parameters', () => {
    const result = clojureCljhttp.generate({
      url: 'https://example.com/api?param1=value1&param2=special value&param3=123',
    })

    expect(result).toBe(
      `(require '[clj-http.client :as client])

(client/get "https://example.com/api" {:query-params {:param1 "value1"
                                                      :param2 "special value"
                                                      :param3 "123"}})`,
    )
  })
})
