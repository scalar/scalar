import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { describe, expect, it } from 'vitest'

import { buildRequestCookieHeader, getCookieHeader } from './build-request-cookie-header'

/**
 * Create a cookie with default values and optional overrides
 */
const createCookie = (
  name: string,
  value: string,
  options: Partial<Omit<XScalarCookie, 'name' | 'value'>> = {},
): XScalarCookie => ({
  name,
  value,
  domain: 'example.com',
  path: '/',
  ...options,
})

describe('getCookieHeader', () => {
  it('generates a cookie header from the cookie params', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, undefined)).toBe('foo=bar')
  })

  it('generates a cookie header with multiple cookies', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar'), createCookie('baz', 'qux')]
    expect(getCookieHeader(cookieParams, undefined)).toBe('foo=bar; baz=qux')
  })

  it('handles cookies with special characters in values', () => {
    const cookieParams: XScalarCookie[] = [
      createCookie('test', 'hello world!@#$%^&*()'),
      createCookie('complex', '{"key": "value"}'),
    ]
    expect(getCookieHeader(cookieParams, undefined)).toBe('test=hello world!@#$%^&*(); complex={"key": "value"}')
  })

  it('handles cookies with empty values', () => {
    const cookieParams: XScalarCookie[] = [createCookie('empty', ''), createCookie('normal', 'value')]
    expect(getCookieHeader(cookieParams, undefined)).toBe('empty=; normal=value')
  })

  it('handles an empty cookie array', () => {
    const cookieParams: XScalarCookie[] = []
    expect(getCookieHeader(cookieParams, undefined)).toBe('')
  })

  it('merges with original cookie header', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value; foo=bar')
  })

  it('merges multiple cookies with original cookie header', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar'), createCookie('baz', 'qux')]
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value; foo=bar; baz=qux')
  })

  it('handles empty cookie params with original cookie header', () => {
    const cookieParams: XScalarCookie[] = []
    expect(getCookieHeader(cookieParams, 'existing=value')).toBe('existing=value')
  })
})

describe('buildRequestCookieHeader', () => {
  describe('basic functionality', () => {
    it('returns null when no cookies are provided', () => {
      const result = buildRequestCookieHeader({
        cookies: [],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toBe(null)
    })

    it('builds a cookie header from cookies', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'localCookie=foo',
      })
    })

    it('merges with original cookie header', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        originalCookieHeader: 'existing=value',
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'existing=value; localCookie=foo',
      })
    })
  })

  describe('custom cookie header', () => {
    it('uses X-Scalar-Cookie header when useCustomCookieHeader is true', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: true,
      })

      expect(result).toMatchObject({
        name: 'X-Scalar-Cookie',
        value: 'localCookie=foo',
      })
    })

    it('uses Cookie header when useCustomCookieHeader is false', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'localCookie=foo',
      })
    })
  })

  describe('domain filtering', () => {
    it('filters cookies by domain match', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('exampleCookie', 'foo', { domain: 'example.com' }),
          createCookie('scalarCookie', 'bar', { domain: 'scalar.com' }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'exampleCookie=foo',
      })
    })

    it('includes cookies with wildcard domain for subdomains', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('wildcardCookie', 'foo', { domain: '.scalar.com' })],
        originalCookieHeader: undefined,
        url: 'https://void.scalar.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'wildcardCookie=foo',
      })
    })

    it('excludes cookies without wildcard for subdomains', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('nonWildcardCookie', 'foo', { domain: 'scalar.com' })],
        originalCookieHeader: undefined,
        url: 'https://void.scalar.com',
        useCustomCookieHeader: false,
      })

      expect(result).toBe(null)
    })

    it('includes cookies without domain specified', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('noDomainCookie', 'foo', { domain: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'noDomainCookie=foo',
      })
    })
  })

  describe('disabled cookies', () => {
    it('excludes disabled cookies', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('enabledCookie', 'foo', { domain: 'example.com', isDisabled: false }),
          createCookie('disabledCookie', 'bar', { domain: 'example.com', isDisabled: true }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'enabledCookie=foo',
      })
    })

    it('includes cookies with isDisabled undefined', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('undefinedDisabledCookie', 'foo', { domain: 'example.com', isDisabled: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'undefinedDisabledCookie=foo',
      })
    })
  })

  describe('empty cookie names', () => {
    it('excludes global cookies with empty names', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('validCookie', 'foo', { domain: 'example.com' }),
          createCookie('', 'bar', { domain: 'example.com' }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'validCookie=foo',
      })
    })
  })

  describe('special characters', () => {
    it('handles cookies with special characters in values', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('test', 'hello world!@#$%^&*()', { domain: undefined }),
          createCookie('complex', '{"key": "value"}', { domain: undefined }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'test=hello world!@#$%^&*(); complex={"key": "value"}',
      })
    })

    it('handles cookies with empty values', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('empty', '', { domain: undefined }),
          createCookie('normal', 'value', { domain: undefined }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'empty=; normal=value',
      })
    })
  })

  describe('complex scenarios', () => {
    it('handles multiple cookies with different domains', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('cookie1', 'value1', { domain: 'example.com' }),
          createCookie('cookie2', 'value2', { domain: '.example.com' }),
          createCookie('cookie3', 'value3', { domain: 'scalar.com' }),
          createCookie('cookie4', 'value4', { domain: undefined }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'cookie1=value1; cookie2=value2; cookie4=value4',
      })
    })

    it('handles environment variables with domain filtering', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('{{cookieName1}}', '{{cookieValue1}}', { domain: 'example.com' }),
          createCookie('{{cookieName2}}', '{{cookieValue2}}', { domain: 'scalar.com' }),
        ],

        originalCookieHeader: undefined,
        url: 'https://example.com/test/path?query=scalar.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: '{{cookieName1}}={{cookieValue1}}',
      })
    })
  })

  describe('URL variations', () => {
    it('handles localhost URLs', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('localCookie', 'value', { domain: 'localhost' })],
        originalCookieHeader: undefined,
        url: 'http://localhost:3000',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'localCookie=value',
      })
    })

    it('handles IP address URLs', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('ipCookie', 'value', { domain: '127.0.0.1' })],
        originalCookieHeader: undefined,
        url: 'http://127.0.0.1:5052',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'ipCookie=value',
      })
    })
  })

  describe('path filtering', () => {
    it('includes cookies when request path starts with cookie path', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('parentPath', 'value', { domain: 'example.com', path: '/api' })],
        originalCookieHeader: undefined,
        url: 'https://example.com/api/users',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'parentPath=value',
      })
    })

    it('excludes cookies when request path does not start with cookie path', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('wrongPath', 'value', { domain: 'example.com', path: '/admin' })],
        originalCookieHeader: undefined,
        url: 'https://example.com/api/users',
        useCustomCookieHeader: false,
      })

      expect(result).toBe(null)
    })

    it('includes cookies without path specified for all requests', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('noPath', 'value', { domain: 'example.com', path: undefined })],
        originalCookieHeader: undefined,
        url: 'https://example.com/api/users',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'noPath=value',
      })
    })

    it('filters multiple cookies by path correctly', () => {
      const result = buildRequestCookieHeader({
        cookies: [
          createCookie('rootCookie', 'root', { domain: 'example.com', path: '/' }),
          createCookie('apiCookie', 'api', { domain: 'example.com', path: '/api' }),
          createCookie('adminCookie', 'admin', { domain: 'example.com', path: '/admin' }),
          createCookie('apiUsersCookie', 'apiusers', { domain: 'example.com', path: '/api/users' }),
        ],
        originalCookieHeader: undefined,
        url: 'https://example.com/api/users',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'rootCookie=root; apiCookie=api; apiUsersCookie=apiusers',
      })
    })
  })

  describe('ordering', () => {
    it('places original header first', () => {
      const result = buildRequestCookieHeader({
        cookies: [createCookie('param', 'pvalue', { domain: undefined })],
        originalCookieHeader: 'original1=value1; original2=value2',
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'original1=value1; original2=value2; param=pvalue',
      })
    })
  })

  describe('edge cases', () => {
    it('handles many cookies', () => {
      const cookies = Array.from({ length: 50 }, (_, i) =>
        createCookie(`param${i}`, `value${i}`, { domain: undefined }),
      )

      const result = buildRequestCookieHeader({
        cookies,
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).not.toBe(null)
      expect(result?.name).toBe('Cookie')
      expect(result?.value).toContain('param0=value0')
      expect(result?.value).toContain('param49=value49')
    })
  })
})
