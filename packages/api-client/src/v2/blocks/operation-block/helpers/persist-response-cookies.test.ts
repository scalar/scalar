import { filterGlobalCookie } from '@scalar/workspace-store/request-example'
import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { describe, expect, it } from 'vitest'

import { getCookieRequestUrl, getResponseCookieActions } from './persist-response-cookies'

describe('getCookieRequestUrl', () => {
  it('returns the URL as-is when it is not proxied', () => {
    expect(getCookieRequestUrl('https://example.com/api/things')).toBe('https://example.com/api/things')
  })

  it('unwraps the target URL from a proxied request', () => {
    const proxied = 'https://proxy.scalar.com/?scalar_url=https%3A%2F%2Fexample.com%2Fapi%2Fthings'
    expect(getCookieRequestUrl(proxied)).toBe('https://example.com/api/things')
  })

  it('returns the input when it cannot be parsed as a URL', () => {
    expect(getCookieRequestUrl('not a url')).toBe('not a url')
  })

  it('falls back to the proxied URL when scalar_url is empty', () => {
    const proxied = 'https://proxy.scalar.com/?scalar_url='
    expect(getCookieRequestUrl(proxied)).toBe(proxied)
  })
})

describe('getResponseCookieActions', () => {
  it('adds a new cookie scoped to the response Set-Cookie attributes', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=abc123; Path=/; Domain=example.com; SameSite=Lax'],
      documentCookies: [],
      requestUrl: 'https://example.com/api/things',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'csrftoken', value: 'abc123', domain: 'example.com', path: '/' },
      },
    ])
  })

  it('falls back to the request host and default path when the cookie omits them', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['session=xyz'],
      documentCookies: [],
      requestUrl: 'https://api.example.com/v1/users',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'session', value: 'xyz', domain: 'api.example.com', path: '/v1' },
      },
    ])
  })

  it('updates an existing cookie in place by index', () => {
    const documentCookies: XScalarCookie[] = [{ name: 'csrftoken', value: 'old', domain: 'example.com', path: '/' }]

    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=new; Path=/; Domain=example.com'],
      documentCookies,
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'csrftoken', value: 'new', domain: 'example.com', path: '/' },
        index: 0,
      },
    ])
  })

  it('deletes a cookie when the server expires it via Max-Age', () => {
    const documentCookies: XScalarCookie[] = [{ name: 'csrftoken', value: 'abc', domain: 'example.com', path: '/' }]

    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=; Max-Age=0; Path=/; Domain=example.com'],
      documentCookies,
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([{ type: 'delete', cookieName: 'csrftoken', index: 0 }])
  })

  it('deletes a cookie when the server expires it via a past Expires date', () => {
    const documentCookies: XScalarCookie[] = [{ name: 'session', value: 'abc', domain: 'example.com', path: '/' }]

    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['session=; Expires=Thu, 01 Jan 1970 00:00:00 GMT; Path=/; Domain=example.com'],
      documentCookies,
      requestUrl: 'https://example.com/api',
      now: 1_000_000,
    })

    expect(actions).toEqual([{ type: 'delete', cookieName: 'session', index: 0 }])
  })

  it('ignores expiring a cookie that is not stored', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=; Max-Age=0; Path=/; Domain=example.com'],
      documentCookies: [],
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([])
  })

  it('keeps a cookie with a future Expires date', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['session=abc; Expires=Tue, 19 Jan 2038 03:14:07 GMT; Path=/'],
      documentCookies: [],
      requestUrl: 'https://example.com/api',
      now: 1_000_000,
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'session', value: 'abc', domain: 'example.com', path: '/' },
      },
    ])
  })

  it('orders index-based changes before appends and deletes from highest index down', () => {
    const documentCookies: XScalarCookie[] = [
      { name: 'a', value: '1', domain: 'example.com', path: '/' },
      { name: 'b', value: '2', domain: 'example.com', path: '/' },
    ]

    const actions = getResponseCookieActions({
      cookieHeaderKeys: [
        'c=3; Path=/; Domain=example.com', // new -> append
        'a=; Max-Age=0; Path=/; Domain=example.com', // delete index 0
        'b=; Max-Age=0; Path=/; Domain=example.com', // delete index 1
      ],
      documentCookies,
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([
      { type: 'delete', cookieName: 'b', index: 1 },
      { type: 'delete', cookieName: 'a', index: 0 },
      { type: 'upsert', cookie: { name: 'c', value: '3', domain: 'example.com', path: '/' } },
    ])
  })

  it('keeps only the last header when a response sets the same cookie twice', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=first; Path=/; Domain=example.com', 'csrftoken=second; Path=/; Domain=example.com'],
      documentCookies: [{ name: 'csrftoken', value: 'old', domain: 'example.com', path: '/' }],
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'csrftoken', value: 'second', domain: 'example.com', path: '/' },
        index: 0,
      },
    ])
  })

  it('deletes a stored cookie when a later header in the same response expires it', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: [
        'csrftoken=fresh; Path=/; Domain=example.com',
        'csrftoken=; Max-Age=0; Path=/; Domain=example.com',
      ],
      documentCookies: [{ name: 'csrftoken', value: 'old', domain: 'example.com', path: '/' }],
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([{ type: 'delete', cookieName: 'csrftoken', index: 0 }])
  })

  it('re-sets a cookie when a later header in the same response follows an expiry', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: [
        'csrftoken=; Max-Age=0; Path=/; Domain=example.com',
        'csrftoken=fresh; Path=/; Domain=example.com',
      ],
      documentCookies: [{ name: 'csrftoken', value: 'old', domain: 'example.com', path: '/' }],
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'csrftoken', value: 'fresh', domain: 'example.com', path: '/' },
        index: 0,
      },
    ])
  })

  it('does not throw when the request URL is not parseable', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['session=xyz'],
      documentCookies: [],
      requestUrl: 'http://[',
    })

    expect(actions).toEqual([
      {
        type: 'upsert',
        cookie: { name: 'session', value: 'xyz', domain: '', path: '/' },
      },
    ])
  })

  it('skips headers without a cookie name', () => {
    const actions = getResponseCookieActions({
      cookieHeaderKeys: ['', '=value'],
      documentCookies: [],
      requestUrl: 'https://example.com/api',
    })

    expect(actions).toEqual([])
  })
})

/**
 * End-to-end check against the real request builder: a cookie persisted from a
 * response must actually be replayed on later requests to the same host, which
 * is what fixes the Django CSRF token being lost on reload (issue #4310).
 */
describe('response cookies are replayed by the request builder', () => {
  const persistCsrfToken = () => {
    const [action] = getResponseCookieActions({
      cookieHeaderKeys: ['csrftoken=abc123; Path=/; SameSite=Lax'],
      documentCookies: [],
      requestUrl: 'https://api.example.com/things',
    })

    if (action?.type !== 'upsert') {
      throw new Error('expected an upsert action')
    }

    return action.cookie
  }

  it('sends the persisted cookie on a later PUT to the same host', () => {
    const cookie = persistCsrfToken()

    expect(
      filterGlobalCookie({
        cookie,
        url: 'https://api.example.com/things/1',
        disabledGlobalCookies: {},
      }),
    ).toBe(true)
  })

  it('does not send the persisted cookie to a different host', () => {
    const cookie = persistCsrfToken()

    expect(
      filterGlobalCookie({
        cookie,
        url: 'https://evil.example.org/things',
        disabledGlobalCookies: {},
      }),
    ).toBe(false)
  })
})
