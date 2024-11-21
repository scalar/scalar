import { describe, expect, it } from 'vitest'

import { curl } from './curl'

describe('curl', () => {
  it('returns a basic request', () => {
    const source = curl({
      url: 'https://example.com',
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('returns a POST request', () => {
    const source = curl({
      url: 'https://example.com',
      method: 'post',
    })

    expect(source.code).toBe(`curl https://example.com \\
  -X POST`)
  })

  it('has headers', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [
        {
          name: 'Content-Type',
          value: 'application/json',
        },
      ],
    })

    expect(source.code).toBe(`curl https://example.com \\
  -H 'Content-Type: application/json'`)
  })

  it('doesn’t add empty headers', () => {
    const source = curl({
      url: 'https://example.com',
      headers: [],
    })

    expect(source.code).toBe('curl https://example.com')
  })

  it('has JSON body', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  -X POST \\
  -H 'Content-Type: application/json' \\
  -d '{"hello":"world"}'`)
  })

  it('has query string', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl 'https://example.com?foo=bar&bar=foo'`)
  })

  it('has cookies', () => {
    const source = curl({
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

    expect(source.code).toBe(`curl https://example.com \\
  -b 'foo=bar; bar=foo'`)
  })

  it('doesn’t add empty cookies', () => {
    const source = curl({
      url: 'https://example.com',
      cookies: [],
    })

    expect(source.code).toBe('curl https://example.com')
  })
})
