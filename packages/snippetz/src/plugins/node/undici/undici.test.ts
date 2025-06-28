import { describe, expect, it } from 'vitest'

import { nodeUndici } from './undici'

describe('nodeUndici', () => {
  it('has import', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
    })

    expect(result).toContain(`import { request } from 'undici'`)
  })

  it('returns a basic request', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('returns a POST request', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      method: 'post',
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  method: 'POST'
})`)
  })

  it('has headers', () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Content-Type': 'application/json'
  }
})`)
  })

  it(`doesn't add empty headers`, () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      headers: [],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })

  it('has JSON body', () => {
    const result = nodeUndici.generate({
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

    expect(result).toBe(`import { request } from 'undici'

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
    const result = nodeUndici.generate({
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

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com?foo=bar&bar=foo')`)
  })

  it('has cookies', () => {
    const result = nodeUndici.generate({
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

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com', {
  headers: {
    'Set-Cookie': 'foo=bar; bar=foo'
  }
})`)
  })

  it(`doesn't add empty cookies`, () => {
    const result = nodeUndici.generate({
      url: 'https://example.com',
      cookies: [],
    })

    expect(result).toBe(`import { request } from 'undici'

const { statusCode, body } = await request('https://example.com')`)
  })
})
