import { describe, expect, it } from 'vitest'

import { nodeOfetch } from './ofetch'

describe('nodeOfetch', () => {
  it.each(['cookie', 'Cookie', 'cOoKiE'])('merges an existing %s header with encoded cookies', (name) => {
    const result = nodeOfetch.generate({
      url: 'https://example.com',
      headers: [{ name, value: 'existing=a+b==; escaped=%2F' }],
      cookies: [
        { name: 'session', value: 'a b;c' },
        { name: 'empty', value: '' },
      ],
    })
    expect(result).toContain(`headers: {
    Cookie: 'existing=a+b==; escaped=%2F; session=a%20b%3Bc; empty='
  }`)
  })

  it('returns a basic request', () => {
    const result = nodeOfetch.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = nodeOfetch.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = nodeOfetch.generate({
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
    const result = nodeOfetch.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = nodeOfetch.generate({
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
    const result = nodeOfetch.generate({
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
    const result = nodeOfetch.generate({
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
    const result = nodeOfetch.generate({
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

ofetch('https://example.com', {
  headers: {
    Cookie: 'foo=bar; bar=foo'
  }
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = nodeOfetch.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`import { ofetch } from 'ofetch'

ofetch('https://example.com')`)
  })
})
