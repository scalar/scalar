import { describe, expect, it } from 'vitest'

import { jsOfetch } from './ofetch'

describe('jsOfetch', () => {
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

ofetch('https://example.com', {
  headers: {
    'Set-Cookie': 'foo=bar; bar=foo'
  }
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
})
