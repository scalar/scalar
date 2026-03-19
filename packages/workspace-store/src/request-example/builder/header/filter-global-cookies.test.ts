import type { XScalarCookie } from '@scalar/workspace-store/schemas/extensions/general/x-scalar-cookies'
import { describe, expect, it } from 'vitest'

import { filterGlobalCookie } from './filter-global-cookies'

describe('filterGlobalCookie', () => {
  const createCookie = (overrides: Partial<XScalarCookie> = {}): XScalarCookie => ({
    name: 'session',
    value: 'abc123',
    ...overrides,
  })

  const testUrl = 'https://example.com/api/users'
  const disabledGlobalCookies = {}

  describe('disabled cookies', () => {
    it('returns false when cookie is disabled', () => {
      const cookie = createCookie({ isDisabled: true })

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns false when cookie is disabled globally', () => {
      const cookie = createCookie({ name: 'session' })
      const disabledGlobalCookies = { session: true }

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns true when cookie is not in disabledGlobalCookies', () => {
      const cookie = createCookie({ name: 'session' })
      const disabledGlobalCookies = { other: true }

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when cookie is explicitly enabled globally', () => {
      const cookie = createCookie({ name: 'session' })
      const disabledGlobalCookies = { session: false }

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })

  describe('cookie name validation', () => {
    it('returns false when cookie name is empty string', () => {
      const cookie = createCookie({ name: '' })

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns true when cookie has a valid name', () => {
      const cookie = createCookie({ name: 'valid-cookie-name' })

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })

  describe('domain matching', () => {
    it('returns true when no domain is specified on cookie', () => {
      const cookie = createCookie({ domain: undefined })

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when domain matches exactly', () => {
      const cookie = createCookie({ domain: 'example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when domain has wildcard prefix and matches', () => {
      const cookie = createCookie({ domain: '.example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when subdomain matches wildcard domain', () => {
      const cookie = createCookie({ domain: '.example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://api.example.com/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when deeply nested subdomain matches wildcard domain', () => {
      const cookie = createCookie({ domain: '.example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://api.v2.staging.example.com/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns false when domain does not match', () => {
      const cookie = createCookie({ domain: 'example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://different.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns false when subdomain does not match non-wildcard domain', () => {
      const cookie = createCookie({ domain: 'example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://api.example.com/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns false when wildcard domain is a different TLD', () => {
      const cookie = createCookie({ domain: '.example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.org/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('handles IP addresses in domain matching', () => {
      const cookie = createCookie({ domain: '192.168.1.1' })

      const result = filterGlobalCookie({
        cookie,
        url: 'http://192.168.1.1:8080/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns false when IP address does not match', () => {
      const cookie = createCookie({ domain: '192.168.1.1' })

      const result = filterGlobalCookie({
        cookie,
        url: 'http://192.168.1.2:8080/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('handles localhost correctly', () => {
      const cookie = createCookie({ domain: 'localhost' })

      const result = filterGlobalCookie({
        cookie,
        url: 'http://localhost:3000/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })

  describe('path matching', () => {
    it('returns true when no path is specified on cookie', () => {
      const cookie = createCookie({ path: undefined })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when path matches exactly', () => {
      const cookie = createCookie({ path: '/api' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when URL path starts with cookie path', () => {
      const cookie = createCookie({ path: '/api' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns true when URL path starts with cookie path including subdirectories', () => {
      const cookie = createCookie({ path: '/api/v1' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/v1/users/123',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns false when URL path does not start with cookie path', () => {
      const cookie = createCookie({ path: '/admin' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns false when paths are similar but do not match prefix', () => {
      const cookie = createCookie({ path: '/api/v2' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/v1/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns true for root path', () => {
      const cookie = createCookie({ path: '/' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/anything/goes/here',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles trailing slashes correctly', () => {
      const cookie = createCookie({ path: '/api/' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles URL without trailing slash', () => {
      const cookie = createCookie({ path: '/api' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })

  describe('combined domain and path matching', () => {
    it('returns true when both domain and path match', () => {
      const cookie = createCookie({
        domain: 'example.com',
        path: '/api',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns false when domain matches but path does not', () => {
      const cookie = createCookie({
        domain: 'example.com',
        path: '/admin',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns false when path matches but domain does not', () => {
      const cookie = createCookie({
        domain: 'example.com',
        path: '/api',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://different.com/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('returns true for wildcard domain and matching path', () => {
      const cookie = createCookie({
        domain: '.example.com',
        path: '/api',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://api.example.com/api/v1/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })

  describe('edge cases', () => {
    it('handles URL with query parameters', () => {
      const cookie = createCookie({ path: '/api' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users?page=1&limit=10',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles URL with hash fragment', () => {
      const cookie = createCookie({ path: '/api' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com/api/users#section',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles URL with port number', () => {
      const cookie = createCookie({ domain: 'example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://example.com:8080/api/users',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles URL with authentication credentials', () => {
      const cookie = createCookie({ domain: 'example.com' })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://user:pass@example.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('handles special characters in cookie name', () => {
      const cookie = createCookie({ name: 'special_cookie-name.123' })

      const result = filterGlobalCookie({
        cookie,
        url: testUrl,
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('returns false when multiple conditions fail', () => {
      const cookie = createCookie({
        isDisabled: true,
        domain: 'example.com',
        path: '/admin',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://different.com/api',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })
  })

  describe('real-world scenarios', () => {
    it('filters authentication cookie for API subdomain', () => {
      const cookie = createCookie({
        name: 'auth_token',
        value: 'jwt-token-here',
        domain: '.example.com',
        path: '/api',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://api.example.com/api/v1/auth/verify',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('filters session cookie for specific path on production', () => {
      const cookie = createCookie({
        name: 'session_id',
        value: 'abc123',
        domain: 'app.example.com',
        path: '/dashboard',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://app.example.com/dashboard/settings',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })

    it('excludes disabled tracking cookie', () => {
      const cookie = createCookie({
        name: 'analytics',
        value: 'tracking-id',
        isDisabled: true,
        domain: '.example.com',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'https://www.example.com/',
        disabledGlobalCookies,
      })

      expect(result).toBe(false)
    })

    it('handles development localhost environment', () => {
      const cookie = createCookie({
        name: 'dev_session',
        value: 'local-dev',
        domain: 'localhost',
        path: '/',
      })

      const result = filterGlobalCookie({
        cookie,
        url: 'http://localhost:3000/api/test',
        disabledGlobalCookies,
      })

      expect(result).toBe(true)
    })
  })
})
