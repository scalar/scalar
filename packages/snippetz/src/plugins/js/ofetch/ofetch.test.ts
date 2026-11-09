import { describe, expect, it } from 'vitest'

import { jsOfetch } from './ofetch'

describe('jsOfetch', () => {
  it('preserves raw Cookie headers and encodes structured cookies for the browser', () => {
    const result = jsOfetch.generate({
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
    const result = jsOfetch.generate({
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
    const result = jsOfetch.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  }
})`)
  })

  it(`doesn't add empty headers`, () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      postData: {
        mimeType: 'application/json',
        text: JSON.stringify({
          hello: 'world',
        }),
      },
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  body: {
    hello: 'world'
  }
})`)
  })

  it('has query string', () => {
    const result = jsOfetch.generate({
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

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  query: {
    foo: 'bar',
    bar: 'foo'
  }
})`)
  })

  it('preserves repeated query parameters as arrays', () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      queryString: [
        {
          name: 'statuses',
          value: 'active',
        },
        {
          name: 'statuses',
          value: 'inactive',
        },
      ],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  query: {
    statuses: ['active', 'inactive']
  }
})`)
  })

  it('has cookies', () => {
    const result = jsOfetch.generate({
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

    expect(result).toBe(`import { ofetch } from 'ofetch'

// Run on the request origin; document.cookie writes cookies for the current page's domain.
document.cookie = "foo=bar; path=/";
document.cookie = "bar=foo; path=/";

ofetch('https://example.com', {
  credentials: 'include'
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = jsOfetch.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })

  it('keeps repeated urlencoded names', () => {
    const result = jsOfetch.generate({
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

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  method: 'POST',
  body: new URLSearchParams([['tag', 'a'], ['tag', 'b']])
})`)
  })

  it.each(['__proto__', 'constructor', 'toString'])('sends a urlencoded body with the name %s', (name) => {
    const snippet = jsOfetch.generate({
      url: 'https://example.com',
      method: 'POST',
      postData: {
        mimeType: 'application/x-www-form-urlencoded',
        params: [{ name, value: 'a' }, { name: 'tag', value: 'b' }, { name: 'tag' }],
      },
    })
    let body: unknown
    new Function('ofetch', snippet.replace("import { ofetch } from 'ofetch'\n", ''))(
      (_url: string, options: { body?: unknown }): void => {
        body = options.body
      },
    )

    expect(String(body)).toStrictEqual(`${name}=a&tag=b&tag=`)
  })
})
