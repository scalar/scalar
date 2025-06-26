import { describe, expect, it } from 'vitest'

import { jsFetch } from './fetch'

describe('jsFetch', () => {
  it('returns a basic request', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`fetch('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  }
})`)
  })

  it(`doesn't add empty headers`, () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = jsFetch.generate({
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

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hello: 'world'
  })
})`)
  })

  it('has raw body', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/octet-stream',
        },
      ],
      postData: {
        mimeType: 'application/octet-stream',
        text: 'hello world',
      },
    })

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/octet-stream'
  },
  body: 'hello world'
})`)
  })

  it('has query string', () => {
    const result = jsFetch.generate({
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

    expect(result).toBe(`fetch('https://example.com?foo=bar&bar=foo')`)
  })

  it('has query string with array values', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'foo',
          value: 'bar',
        },
        {
          name: 'foo',
          value: 'baz',
        },
      ],
    })

    expect(result).toBe(`fetch('https://example.com?foo=bar&foo=baz')`)
  })

  it('has cookies', () => {
    const result = jsFetch.generate({
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

    expect(result).toBe(`fetch('https://example.com', {
  headers: {
    'Set-Cookie': 'foo=bar; bar=foo'
  }
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('has urlencoded body', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/x-www-form-urlencoded',
        },
      ],
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          {
            name: 'foo',
            value: 'bar',
          },
          {
            name: 'baz',
            value: 'foo',
          },
        ],
      },
    })

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/x-www-form-urlencoded'
  },
  body: new URLSearchParams({
    foo: 'bar',
    baz: 'foo'
  })
})`)
  })

  it('has multipart body', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'multipart/form-data',
        params: [
          {
            name: 'foo',
            value: 'bar',
          },
          {
            name: 'file',
            fileName: 'baz.txt',
          },
        ],
      },
    })

    expect(result).toBe(`const formData = new FormData()
formData.append('foo', 'bar')
formData.append('file', new Blob([]), 'baz.txt')

fetch('https://example.com', {
  method: 'POST',
  body: formData
})`)
  })
})
