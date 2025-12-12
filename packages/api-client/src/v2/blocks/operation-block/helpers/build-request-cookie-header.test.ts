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

  it('does not add trailing semicolon when cookieParams is empty but originalCookieHeader exists', () => {
    const cookieParams: XScalarCookie[] = []
    const result = getCookieHeader(cookieParams, 'session=abc123')
    expect(result).toBe('session=abc123')
    expect(result).not.toContain('session=abc123;')
  })

  it('handles original cookie header with multiple cookies', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, 'first=one; second=two')).toBe('first=one; second=two; foo=bar')
  })

  it('trims whitespace from the result', () => {
    const cookieParams: XScalarCookie[] = [createCookie('foo', 'bar')]
    expect(getCookieHeader(cookieParams, undefined)).toBe('foo=bar')
  })
})

describe('buildRequestCookieHeader', () => {
  describe('basic functionality', () => {
    it('returns null when no cookies are provided', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toBe(null)
    })

    it('builds a cookie header from param cookies only', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'localCookie=foo',
      })
    })

    it('builds a cookie header from global cookies only', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('globalCookie', 'bar', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'globalCookie=bar',
      })
    })

    it('combines param and global cookies', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        globalCookies: [createCookie('globalCookie', 'bar', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'globalCookie=bar; localCookie=foo',
      })
    })

    it('merges with original cookie header', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        globalCookies: [],
        env: {},
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
        paramCookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        globalCookies: [],
        env: {},
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
        paramCookies: [createCookie('localCookie', 'foo', { domain: undefined })],
        globalCookies: [],
        env: {},
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
    it('filters global cookies by exact domain match', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [
          createCookie('matchingCookie', 'foo', { domain: 'example.com' }),
          createCookie('nonMatchingCookie', 'bar', { domain: 'scalar.com' }),
        ],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'matchingCookie=foo',
      })
    })

    it('includes cookies with wildcard domain for subdomains', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('wildcardCookie', 'foo', { domain: '.scalar.com' })],
        env: {},
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
        paramCookies: [],
        globalCookies: [createCookie('nonWildcardCookie', 'foo', { domain: 'scalar.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://void.scalar.com',
        useCustomCookieHeader: false,
      })

      expect(result).toBe(null)
    })

    it('includes cookies without domain specified', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('noDomainCookie', 'foo', { domain: undefined })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'noDomainCookie=foo',
      })
    })

    it('filters out cookies from different domains', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [
          createCookie('exampleCookie', 'foo', { domain: 'example.com' }),
          createCookie('scalarCookie', 'bar', { domain: 'scalar.com' }),
          createCookie('otherCookie', 'baz', { domain: 'other.com' }),
        ],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'exampleCookie=foo',
      })
    })
  })

  describe('disabled cookies', () => {
    it('excludes disabled global cookies', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [
          createCookie('enabledCookie', 'foo', { domain: 'example.com', isDisabled: false }),
          createCookie('disabledCookie', 'bar', { domain: 'example.com', isDisabled: true }),
        ],
        env: {},
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
        paramCookies: [],
        globalCookies: [
          createCookie('undefinedDisabledCookie', 'foo', { domain: 'example.com', isDisabled: undefined }),
        ],
        env: {},
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

  describe('environment variable replacement', () => {
    it('replaces environment variables in both name and value of global cookies', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('{{cookieName}}', '{{cookieValue}}', { domain: 'example.com' })],
        env: { cookieName: 'auth', cookieValue: 'token123' },
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'auth=token123',
      })
    })

    it('handles multiple environment variables in a single value', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('session', '{{userId}}-{{timestamp}}', { domain: 'example.com' })],
        env: { userId: 'user123', timestamp: '1234567890' },
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'session=user123-1234567890',
      })
    })

    it('leaves unreplaced variables when env is missing', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('token', '{{missingVar}}', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'token={{missingVar}}',
      })
    })
  })

  describe('empty cookie names', () => {
    it('excludes global cookies with empty names', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [
          createCookie('validCookie', 'foo', { domain: 'example.com' }),
          createCookie('', 'bar', { domain: 'example.com' }),
        ],
        env: {},
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
        paramCookies: [
          createCookie('test', 'hello world!@#$%^&*()', { domain: undefined }),
          createCookie('complex', '{"key": "value"}', { domain: undefined }),
        ],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'test=hello world!@#$%^&*(); complex={"key": "value"}',
      })
    })

    it('handles cookies with unicode values', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [
          createCookie('greeting', '你好', { domain: undefined }),
          createCookie('emoji', '👋', { domain: undefined }),
        ],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'greeting=你好; emoji=👋',
      })
    })

    it('handles cookies with empty values', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [
          createCookie('empty', '', { domain: undefined }),
          createCookie('normal', 'value', { domain: undefined }),
        ],
        globalCookies: [],
        env: {},
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
    it('combines param cookies, global cookies, and original header', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('localCookie', 'local', { domain: undefined })],
        globalCookies: [createCookie('globalCookie', 'global', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: 'existing=value',
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'existing=value; globalCookie=global; localCookie=local',
      })
    })

    it('handles multiple global cookies with different domains', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [
          createCookie('cookie1', 'value1', { domain: 'example.com' }),
          createCookie('cookie2', 'value2', { domain: '.example.com' }),
          createCookie('cookie3', 'value3', { domain: 'scalar.com' }),
          createCookie('cookie4', 'value4', { domain: undefined }),
        ],
        env: {},
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
        paramCookies: [],
        globalCookies: [
          createCookie('{{cookieName1}}', '{{cookieValue1}}', { domain: 'example.com' }),
          createCookie('{{cookieName2}}', '{{cookieValue2}}', { domain: 'scalar.com' }),
        ],
        env: {
          cookieName1: 'auth',
          cookieValue1: 'token123',
          cookieName2: 'session',
          cookieValue2: 'session456',
        },
        originalCookieHeader: undefined,
        url: 'https://example.com/test/path?query=scalar.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'auth=token123',
      })
    })

    it('handles all filtering conditions together', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('paramCookie', 'param', { domain: undefined })],
        globalCookies: [
          createCookie('validCookie', 'valid', { domain: 'example.com', isDisabled: false }),
          createCookie('disabledCookie', 'disabled', { domain: 'example.com', isDisabled: true }),
          createCookie('wrongDomainCookie', 'wrong', { domain: 'scalar.com', isDisabled: false }),
          createCookie('', 'empty', { domain: 'example.com', isDisabled: false }),
          createCookie('{{envCookie}}', '{{envValue}}', { domain: 'example.com', isDisabled: false }),
        ],
        env: { envCookie: 'envName', envValue: 'envVal' },
        originalCookieHeader: 'original=header',
        url: 'https://example.com',
        useCustomCookieHeader: true,
      })

      expect(result).toMatchObject({
        name: 'X-Scalar-Cookie',
        value: 'original=header; validCookie=valid; envName=envVal; paramCookie=param',
      })
    })
  })

  describe('URL variations', () => {
    it('handles URLs with ports', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('portCookie', 'value', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com:8080',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'portCookie=value',
      })
    })

    it('handles URLs with paths', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('pathCookie', 'value', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com/api/v1/users',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'pathCookie=value',
      })
    })

    it('handles URLs with query parameters', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('queryCookie', 'value', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com?foo=bar&baz=qux',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'queryCookie=value',
      })
    })

    it('handles localhost URLs', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('localCookie', 'value', { domain: 'localhost' })],
        env: {},
        originalCookieHeader: undefined,
        url: 'http://localhost:3000',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'localCookie=value',
      })
    })

    it('handles 127.0.0.1 URLs', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [],
        globalCookies: [createCookie('ipCookie', 'value', { domain: '127.0.0.1' })],
        env: {},
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

  describe('ordering', () => {
    it('places global cookies before param cookies', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [
          createCookie('param1', 'pvalue1', { domain: undefined }),
          createCookie('param2', 'pvalue2', { domain: undefined }),
        ],
        globalCookies: [
          createCookie('global1', 'gvalue1', { domain: 'example.com' }),
          createCookie('global2', 'gvalue2', { domain: 'example.com' }),
        ],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'global1=gvalue1; global2=gvalue2; param1=pvalue1; param2=pvalue2',
      })
    })

    it('places original header first', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('param', 'pvalue', { domain: undefined })],
        globalCookies: [createCookie('global', 'gvalue', { domain: 'example.com' })],
        env: {},
        originalCookieHeader: 'original1=value1; original2=value2',
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'original1=value1; original2=value2; global=gvalue; param=pvalue',
      })
    })
  })

  describe('edge cases', () => {
    it('handles cookies with equals signs in values', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('base64', 'dGVzdD1kYXRh', { domain: undefined })],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'base64=dGVzdD1kYXRh',
      })
    })

    it('handles cookies with semicolons in values', () => {
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('data', 'part1;part2', { domain: undefined })],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: 'data=part1;part2',
      })
    })

    it('handles very long cookie values', () => {
      const longValue = 'a'.repeat(4000)
      const result = buildRequestCookieHeader({
        paramCookies: [createCookie('longCookie', longValue, { domain: undefined })],
        globalCookies: [],
        env: {},
        originalCookieHeader: undefined,
        url: 'https://example.com',
        useCustomCookieHeader: false,
      })

      expect(result).toMatchObject({
        name: 'Cookie',
        value: `longCookie=${longValue}`,
      })
    })

    it('handles many cookies', () => {
      const paramCookies = Array.from({ length: 50 }, (_, i) =>
        createCookie(`param${i}`, `value${i}`, { domain: undefined }),
      )

      const result = buildRequestCookieHeader({
        paramCookies,
        globalCookies: [],
        env: {},
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
