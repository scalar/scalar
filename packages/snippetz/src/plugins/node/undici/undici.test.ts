import { describe, expect, it } from 'vitest'

import { undici } from './undici'

describe('undici', () => {
  it('has import', () => {
    const source = undici({
      url: 'https://example.com',
    })

    expect(source.code).toContain(`import { request } from 'undici'`)
  })

  it('returns a basic request', () => {
    const source = undici({
      url: 'https://example.com',
    })

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('returns a POST request', () => {
    const source = undici({
      url: 'https://example.com',
      method: 'post',
    })

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const source = undici({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  }
})`)
  })

  it('doesn’t add empty headers', () => {
    const source = undici({
      url: 'https://example.com',
      headers: [],
    })

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('has JSON body', () => {
    const source = undici({
      url: 'https://example.com',
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

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  },
  body: JSON.stringify({
    hello: 'world'
  })
})`)
  })

  it('has query string', () => {
    const source = undici({
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

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com?foo=bar&bar=foo')`)
  })

  it('has cookies', () => {
    const source = undici({
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

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Set-Cookie': 'foo=bar; bar=foo'
  }
})`)
  })

  it('doesn’t add empty cookies', () => {
    const source = undici({
      url: 'https://example.com',
      cookies: [],
    })

    expect(source.code).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })
})
