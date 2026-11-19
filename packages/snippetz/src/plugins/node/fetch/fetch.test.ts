import { describe, expect, it } from 'vitest'

import { nodeFetch } from './fetch'

describe('nodeFetch', () => {
  it.each([true, false, 0, 42, 'true', 'false', 'null', 'hello', null])('preserves the root JSON value %j', (value) => {
    const result = nodeFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: { mimeType: 'application/json', text: JSON.stringify(value) },
    })
    expect(result).toContain(`body: JSON.stringify(${JSON.stringify(value)})`)
  })

  it('returns a basic request', () => {
    const result = nodeFetch.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = nodeFetch.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = nodeFetch.generate({
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
    const result = nodeFetch.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = nodeFetch.generate({
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
    const result = nodeFetch.generate({
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
    const result = nodeFetch.generate({
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

  it('has cookies', () => {
    const result = nodeFetch.generate({
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
    Cookie: 'foo=bar; bar=foo'
  }
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = nodeFetch.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`fetch('https://example.com')`)
  })

  it('has urlencoded body', () => {
    const result = nodeFetch.generate({
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
  body: new URLSearchParams([['foo', 'bar'], ['baz', 'foo']])
})`)
  })

  it('keeps repeated urlencoded names', () => {
    const result = nodeFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [
          { name: 'tag', value: 'a' },
          { name: 'tag', value: 'b' },
        ],
      },
    })

    expect(result).toBe(`fetch('https://example.com', {
  method: 'POST',
  body: new URLSearchParams([['tag', 'a'], ['tag', 'b']])
})`)
  })

  it('has multipart body', () => {
    const result = nodeFetch.generate({
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

    expect(result).toBe(`import { readFileSync } from 'node:fs';

const formData = new FormData();
formData.append("foo", "bar");
formData.append("file", new File([readFileSync("baz.txt")], "baz.txt", { type: "application/octet-stream" }));

fetch('https://example.com', {
  method: 'POST',
  body: formData
})`)
  })

  it.each([
    ["https://example.com/Customers('ALFKI')/$count", "fetch('https://example.com/Customers(\\'ALFKI\\')/$count')"],
    ['https://example.com/files/a\\b', "fetch('https://example.com/files/a\\\\b')"],
  ])('escapes the request URL %s', (url, expected) => {
    expect(nodeFetch.generate({ url })).toBe(expected)
  })

  it('escapes apostrophes that the query string keeps', () => {
    const result = nodeFetch.generate({
      url: 'https://example.com/Products',
      queryString: [{ name: '$filter', value: "Name eq 'John'" }],
    })
    expect(result).toBe("fetch('https://example.com/Products?%24filter=Name%20eq%20\\'John\\'')")
  })
})
