import { describe, expect, it } from 'vitest'

import { jsFetch } from './fetch'

describe('jsFetch', () => {
  it.each([true, false, 0, 42, 'true', 'false', 'null', 'hello', null])('preserves the root JSON value %j', (value) => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: { mimeType: 'application/json', text: JSON.stringify(value) },
    })
    expect(result).toContain(`body: JSON.stringify(${JSON.stringify(value)})`)
  })

  it('preserves raw Cookie headers and encodes structured cookies for the browser', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      headers: [{ name: 'cOoKiE', value: 'existing=a+b==; escaped=%2F' }],
      cookies: [
        { name: 'session', value: 'a b;c' },
        { name: 'empty', value: '' },
      ],
    })
    expect(result).toContain(`document.cookie = "session=a%20b%3Bc; path=/";
document.cookie = "empty=; path=/";
document.cookie = "existing=a+b==; path=/";
document.cookie = "escaped=%2F; path=/";`)
    expect(result).toContain("credentials: 'include'")
    expect(result.includes('headers:')).toBe(false)
  })

  it('keeps cookie setup when generating a multipart body', () => {
    const result = jsFetch.generate({
      url: 'https://example.com',
      method: 'POST',
      cookies: [{ name: 'session', value: 'abc123' }],
      postData: { mimeType: 'multipart/form-data', params: [{ name: 'note', value: 'hello' }] },
    })
    expect(result).toContain('document.cookie = "session=abc123; path=/";')
    expect(result).toContain('const formData = new FormData();')
    expect(result).toContain("credentials: 'include'")
    expect(result).toContain('body: formData')
  })

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

  it('preserves nested arrays in the JSON body', () => {
    const result = jsFetch.generate({
      url: 'https://example.com/test',
      method: 'POST',
      headers: [{ name: 'Content-Type', value: 'application/json' }],
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({ type: 'Example', coordinates: [[[1]]] }),
      },
    })

    expect(result).toBe(`fetch('https://example.com/test', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    type: 'Example',
    coordinates: [[[1]]]
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

    expect(result).toBe(`// Run on the request origin; document.cookie writes cookies for the current page's domain.
document.cookie = "foo=bar; path=/";
document.cookie = "bar=foo; path=/";

fetch('https://example.com', {
  credentials: 'include'
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
  body: new URLSearchParams([['foo', 'bar'], ['baz', 'foo']])
})`)
  })

  it('keeps repeated urlencoded names', () => {
    const result = jsFetch.generate({
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

    expect(result).toBe(`const formData = new FormData();
// Select upload files with an <input type="file" multiple> element first.
const files = document.querySelector('input[type="file"]').files;
formData.append("foo", "bar");
formData.append("file", new File([files[0]], "baz.txt", { type: "application/octet-stream" }));

fetch('https://example.com', {
  method: 'POST',
  body: formData
})`)
  })
})
