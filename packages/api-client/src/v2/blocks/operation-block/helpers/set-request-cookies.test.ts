import { type Cookie, cookieSchema } from '@scalar/oas-utils/entities/cookie'
import { describe, expect, it } from 'vitest'

import { requestExampleSchema } from '@scalar/oas-utils/entities/spec'
import { getCookieHeader, matchesDomain, setRequestCookies } from './set-request-cookies'

describe('setRequestCookies', () => {
  it('should set local and global cookies', () => {
    // Local cookie
    const localCookieParameter = {
      key: 'localCookie',
      value: 'foo',
      enabled: true,
    }

    const example = requestExampleSchema.parse({
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
      proxyUrl: undefined,
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

  it('should match the current domain with a configured wildcard', () => {
    expect(matchesDomain('https://example.com', '.example.com')).toBe(true)
  })

  it('should not match the current host', () => {
    expect(matchesDomain('https://example.com', 'scalar.com')).toBe(false)
  })

  it('should match the subdomain with a configured wildcard', () => {
    expect(matchesDomain('https://void.scalar.com', '.scalar.com')).toBe(true)
  })

  it("shouldn't match the current host without a wildcard", () => {
    expect(matchesDomain('https://void.scalar.com', 'scalar.com')).toBe(false)
  })
})

describe('getCookieHeader', () => {
  it('generates a cookie header from the cookie params', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams)).toBe('foo=bar')
  })

  it('generates a cookie header with multiple cookies', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar'), createCookie('baz', 'qux')]
    expect(getCookieHeader(cookieParams)).toBe('foo=bar; baz=qux')
  })

  it('handles cookies with special characters in values', () => {
    const cookieParams: Cookie[] = [
      createCookie('test', 'hello world!@#$%^&*()'),
      createCookie('complex', '{"key": "value"}'),
    ]
    expect(getCookieHeader(cookieParams)).toBe('test=hello world!@#$%^&*(); complex={"key": "value"}')
  })

  it('handles cookies with empty values', () => {
    const cookieParams: Cookie[] = [createCookie('empty', ''), createCookie('normal', 'value')]
    expect(getCookieHeader(cookieParams)).toBe('empty=; normal=value')
  })

  it('handles an empty cookie array', () => {
    const cookieParams: Cookie[] = []
    expect(getCookieHeader(cookieParams)).toBe('')
  })

  it('handles cookies with unicode values', () => {
    const cookieParams: Cookie[] = [createCookie('greeting', '你好'), createCookie('emoji', '👋')]
    expect(getCookieHeader(cookieParams)).toBe('greeting=你好; emoji=👋')
  })

  it('merges with original cookie header', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value; foo=bar')
  })

  it('merges multiple cookies with original cookie header', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar'), createCookie('baz', 'qux')]
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value; foo=bar; baz=qux')
  })

  it('handles empty cookie params with original cookie header', () => {
    const cookieParams: Cookie[] = []
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value;')
  })

  it('handles original cookie header with multiple cookies', () => {
    const cookieParams: Cookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, 'first=one; second=two')).toBe('first=one; second=two; foo=bar')
  })
})

/**
 * Create a cookie with default values and optional overrides
 */
const createCookie = (name: string, value: string, options: Partial<Exclude<Cookie, 'name' | 'value'>> = {}): Cookie =>
  cookieSchema.parse({
    name,
    value,
    domain: 'example.com',
    path: '/',
    ...options,
  })
