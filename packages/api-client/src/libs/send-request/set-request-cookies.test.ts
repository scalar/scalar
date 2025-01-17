import type { Cookie } from '@scalar/oas-utils/entities/cookie'
import type { RequestExample } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import {
  getCookieHeader,
  matchesDomain,
  setRequestCookies,
} from './set-request-cookies'

describe('setRequestCookies', () => {
  it('should set local and global cookies', () => {
    // Local cookie
    const localCookieParameter = {
      key: 'localCookie',
      value: 'foo',
      enabled: true,
    }

    const example: RequestExample = createRequestExample({
      parameters: {
        cookies: [localCookieParameter],
        path: [],
        query: [],
        headers: [],
      },
    })

    // Global
    const globalCookies: Cookie[] = [
      createCookie('globalCookie', 'bar', {
        domain: 'example.com',
      }),
    ]

    const { cookieParams } = setRequestCookies({
      example,
      env: {},
      globalCookies,
      serverUrl: 'https://example.com/v1',
    })

    expect(cookieParams).toMatchObject([
      {
        name: 'globalCookie',
        value: 'bar',
        domain: 'example.com',
      },
      {
        name: 'localCookie',
        value: 'foo',
        domain: '.example.com',
      },
    ])
  })
})

describe('matchesDomain', () => {
  it('should match the current host', () => {
    expect(matchesDomain('https://example.com', 'example.com')).toBe(true)
  })

  it('should match the current host with a wildcard', () => {
    expect(matchesDomain('https://example.com', '.example.com')).toBe(true)
  })

  it('should not match the current host', () => {
    expect(matchesDomain('https://example.com', 'scalar.com')).toBe(false)
  })

  it('should match the current host with a wildcard', () => {
    expect(matchesDomain('https://void.scalar.com', '.scalar.com')).toBe(true)
  })

  it('shouldn’t match the current host without a wildcard', () => {
    expect(matchesDomain('https://void.scalar.com', 'scalar.com')).toBe(false)
  })
})

describe('getCookieHeader', () => {
  it('should generate a cookie header from the cookie params', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams)).toBe('foo=bar')
  })

  it('should generate a cookie header with multiple cookies', () => {
    const cookieParams: Cookie[] = [
      createCookie('foo', 'bar'),
      createCookie('baz', 'qux'),
    ]
    expect(getCookieHeader(cookieParams)).toBe('foo=bar; baz=qux')
  })

  it('should handle cookies with special characters in values', () => {
    const cookieParams: Cookie[] = [
      createCookie('test', 'hello world!@#$%^&*()'),
      createCookie('complex', '{"key": "value"}'),
    ]
    expect(getCookieHeader(cookieParams)).toBe(
      'test=hello world!@#$%^&*(); complex={"key": "value"}',
    )
  })

  it('should handle cookies with empty values', () => {
    const cookieParams: Cookie[] = [
      createCookie('empty', ''),
      createCookie('normal', 'value'),
    ]
    expect(getCookieHeader(cookieParams)).toBe('empty=; normal=value')
  })

  it('should handle cookies with various attributes without including them in header', () => {
    const cookieParams: Cookie[] = [
      createCookie('test', 'value', {
        domain: 'test.com',
        path: '/api',
        httpOnly: true,
        secure: true,
        sameSite: 'Strict',
        expires: new Date('2024-01-01'),
      }),
    ]
    expect(getCookieHeader(cookieParams)).toBe('test=value')
  })

  it('should handle an empty cookie array', () => {
    const cookieParams: Cookie[] = []
    expect(getCookieHeader(cookieParams)).toBe('')
  })

  it('should handle cookies with same names but different domains', () => {
    const cookieParams: Cookie[] = [
      createCookie('session', 'abc123', { domain: 'example.com' }),
      createCookie('session', 'def456', { domain: 'api.example.com' }),
    ]
    expect(getCookieHeader(cookieParams)).toBe('session=abc123; session=def456')
  })

  it('should handle cookies with unicode values', () => {
    const cookieParams: Cookie[] = [
      createCookie('greeting', '你好'),
      createCookie('emoji', '👋'),
    ]
    expect(getCookieHeader(cookieParams)).toBe('greeting=你好; emoji=👋')
  })
})

/**
 * Create a cookie with default values and optional overrides
 */
function createCookie(
  name: string,
  value: string,
  options: Partial<Exclude<Cookie, 'name' | 'value'>> = {},
): Cookie {
  return {
    name,
    value,
    domain: 'example.com',
    path: '/',
    // tomorrow
    expires: new Date(Date.now() + 24 * 60 * 60 * 1000),
    httpOnly: true,
    secure: true,
    sameSite: 'None',
    uid: 'globalCookie',
    // overwrite (optional)
    ...options,
  }
}

function createRequestExample(
  example: Partial<RequestExample> = {},
): RequestExample {
  return {
    type: 'requestExample' as const,
    uid: 'example',
    name: 'Example',
    requestUid: 'request',
    parameters: {
      cookies: [],
      path: [],
      query: [],
      headers: [],
    },
    body: {
      activeBody: 'raw' as const,
      raw: {
        encoding: 'json',
        value: '',
      },
    },
    ...example,
  }
}
