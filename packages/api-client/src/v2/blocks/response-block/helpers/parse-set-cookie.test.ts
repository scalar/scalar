import { describe, expect, it } from 'vitest'

import { parseSetCookie } from './parse-set-cookie'

describe('parseSetCookie', () => {
  describe('valid cookie parsing', () => {
    it('parses simple cookie with name and value', () => {
      const result = parseSetCookie('sessionId=abc123')

      expect(result).toEqual({
        name: 'sessionId',
        value: 'abc123',
      })
    })

    it('parses cookie with attributes', () => {
      const result = parseSetCookie('sessionId=abc123; Path=/; HttpOnly')

      expect(result).toEqual({
        name: 'sessionId',
        value: 'abc123; Path=/; HttpOnly',
      })
    })

    it('parses cookie with multiple attributes', () => {
      const result = parseSetCookie('token=xyz789; Path=/; Secure; HttpOnly; SameSite=Strict')

      expect(result).toEqual({
        name: 'token',
        value: 'xyz789; Path=/; Secure; HttpOnly; SameSite=Strict',
      })
    })

    it('parses cookie with Max-Age attribute', () => {
      const result = parseSetCookie('userId=123; Max-Age=3600')

      expect(result).toEqual({
        name: 'userId',
        value: '123; Max-Age=3600',
      })
    })

    it('parses cookie with Expires attribute', () => {
      const result = parseSetCookie('session=abc; Expires=Wed, 21 Oct 2025 07:28:00 GMT')

      expect(result).toEqual({
        name: 'session',
        value: 'abc; Expires=Wed, 21 Oct 2025 07:28:00 GMT',
      })
    })

    it('parses cookie with Domain attribute', () => {
      const result = parseSetCookie('tracking=xyz; Domain=.example.com')

      expect(result).toEqual({
        name: 'tracking',
        value: 'xyz; Domain=.example.com',
      })
    })

    it('parses cookie with SameSite attribute', () => {
      const result = parseSetCookie('csrf=token123; SameSite=Lax')

      expect(result).toEqual({
        name: 'csrf',
        value: 'token123; SameSite=Lax',
      })
    })
  })

  describe('whitespace handling', () => {
    it('trims whitespace from cookie name', () => {
      const result = parseSetCookie('  sessionId  =abc123')

      expect(result).toEqual({
        name: 'sessionId',
        value: 'abc123',
      })
    })

    it('trims whitespace from cookie value', () => {
      const result = parseSetCookie('sessionId=  abc123  ')

      expect(result).toEqual({
        name: 'sessionId',
        value: 'abc123',
      })
    })

    it('handles whitespace around equals sign', () => {
      const result = parseSetCookie('sessionId = abc123')

      expect(result).toEqual({
        name: 'sessionId',
        value: 'abc123',
      })
    })

    it('preserves whitespace in attribute values', () => {
      const result = parseSetCookie('name=value; Path= / ')

      expect(result).toEqual({
        name: 'name',
        value: 'value; Path= /',
      })
    })
  })

  describe('special characters in values', () => {
    it('handles equals signs in cookie value', () => {
      const result = parseSetCookie('data=key1=value1&key2=value2')

      expect(result).toEqual({
        name: 'data',
        value: 'key1=value1&key2=value2',
      })
    })

    it('handles multiple equals signs in value', () => {
      const result = parseSetCookie('encoded=a=b=c=d')

      expect(result).toEqual({
        name: 'encoded',
        value: 'a=b=c=d',
      })
    })

    it('handles semicolons in quoted value', () => {
      const result = parseSetCookie('complex="value;with;semicolons"; Path=/')

      expect(result).toEqual({
        name: 'complex',
        value: '"value;with;semicolons"; Path=/',
      })
    })

    it('handles commas in value', () => {
      const result = parseSetCookie('list=item1,item2,item3')

      expect(result).toEqual({
        name: 'list',
        value: 'item1,item2,item3',
      })
    })

    it('handles special characters in value', () => {
      const result = parseSetCookie('special=!@#$%^&*()')

      expect(result).toEqual({
        name: 'special',
        value: '!@#$%^&*()',
      })
    })

    it('handles URL-encoded values', () => {
      const result = parseSetCookie('redirect=%2Fhome%2Fuser')

      expect(result).toEqual({
        name: 'redirect',
        value: '%2Fhome%2Fuser',
      })
    })

    it('handles base64-encoded values', () => {
      const result = parseSetCookie('jwt=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0')

      expect(result).toEqual({
        name: 'jwt',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiIxMjM0NTY3ODkwIn0',
      })
    })
  })

  describe('edge cases', () => {
    it('handles empty cookie value', () => {
      const result = parseSetCookie('empty=')

      expect(result).toEqual({
        name: 'empty',
        value: '',
      })
    })

    it('handles empty cookie value with attributes', () => {
      const result = parseSetCookie('empty=; Path=/; HttpOnly')

      expect(result).toEqual({
        name: 'empty',
        value: '; Path=/; HttpOnly',
      })
    })

    it('handles very long cookie name', () => {
      const longName = 'a'.repeat(100)
      const result = parseSetCookie(`${longName}=value`)

      expect(result).toEqual({
        name: longName,
        value: 'value',
      })
    })

    it('handles very long cookie value', () => {
      const longValue = 'x'.repeat(4096)
      const result = parseSetCookie(`name=${longValue}`)

      expect(result).toEqual({
        name: 'name',
        value: longValue,
      })
    })

    it('handles cookie name with hyphens', () => {
      const result = parseSetCookie('my-cookie-name=value')

      expect(result).toEqual({
        name: 'my-cookie-name',
        value: 'value',
      })
    })

    it('handles cookie name with underscores', () => {
      const result = parseSetCookie('my_cookie_name=value')

      expect(result).toEqual({
        name: 'my_cookie_name',
        value: 'value',
      })
    })

    it('handles cookie name with numbers', () => {
      const result = parseSetCookie('cookie123=value')

      expect(result).toEqual({
        name: 'cookie123',
        value: 'value',
      })
    })

    it('handles quoted cookie value', () => {
      const result = parseSetCookie('quoted="some value"')

      expect(result).toEqual({
        name: 'quoted',
        value: '"some value"',
      })
    })
  })

  describe('invalid input', () => {
    it('returns null for empty string', () => {
      const result = parseSetCookie('')

      expect(result).toBeNull()
    })

    it('returns null for whitespace-only string', () => {
      const result = parseSetCookie('   ')

      expect(result).toBeNull()
    })

    it('returns null for string without equals sign', () => {
      const result = parseSetCookie('invalidcookie')

      expect(result).toBeNull()
    })

    it('returns null for string with only equals sign', () => {
      const result = parseSetCookie('=')

      expect(result).toBeNull()
    })

    it('returns null for string with empty name', () => {
      const result = parseSetCookie('=value')

      expect(result).toBeNull()
    })

    it('returns null for string with whitespace-only name', () => {
      const result = parseSetCookie('   =value')

      expect(result).toBeNull()
    })

    it('returns null for null input', () => {
      // @ts-expect-error Testing invalid input
      const result = parseSetCookie(null)

      expect(result).toBeNull()
    })

    it('returns null for undefined input', () => {
      // @ts-expect-error Testing invalid input
      const result = parseSetCookie(undefined)

      expect(result).toBeNull()
    })

    it('returns null for number input', () => {
      // @ts-expect-error Testing invalid input
      const result = parseSetCookie(123)

      expect(result).toBeNull()
    })

    it('returns null for object input', () => {
      // @ts-expect-error Testing invalid input
      const result = parseSetCookie({ name: 'test' })

      expect(result).toBeNull()
    })

    it('returns null for array input', () => {
      // @ts-expect-error Testing invalid input
      const result = parseSetCookie(['test'])

      expect(result).toBeNull()
    })
  })

  describe('real-world scenarios', () => {
    it('parses session cookie from Express.js', () => {
      const result = parseSetCookie('connect.sid=s%3A1234567890.abcdefghijklmnop; Path=/; HttpOnly')

      expect(result).toEqual({
        name: 'connect.sid',
        value: 's%3A1234567890.abcdefghijklmnop; Path=/; HttpOnly',
      })
    })

    it('parses JWT cookie', () => {
      const result = parseSetCookie('token=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Secure; HttpOnly; SameSite=Strict')

      expect(result).toEqual({
        name: 'token',
        value: 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9; Secure; HttpOnly; SameSite=Strict',
      })
    })

    it('parses authentication cookie with expiry', () => {
      const result = parseSetCookie('auth=abc123; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Path=/; Secure; HttpOnly')

      expect(result).toEqual({
        name: 'auth',
        value: 'abc123; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Path=/; Secure; HttpOnly',
      })
    })

    it('parses tracking cookie', () => {
      const result = parseSetCookie(
        '_ga=GA1.2.1234567890.1234567890; Expires=Thu, 31 Dec 2026 23:59:59 GMT; Path=/; Domain=.example.com',
      )

      expect(result).toEqual({
        name: '_ga',
        value: 'GA1.2.1234567890.1234567890; Expires=Thu, 31 Dec 2026 23:59:59 GMT; Path=/; Domain=.example.com',
      })
    })

    it('parses CSRF token cookie', () => {
      const result = parseSetCookie('XSRF-TOKEN=abc-123-def-456; Path=/; SameSite=Strict')

      expect(result).toEqual({
        name: 'XSRF-TOKEN',
        value: 'abc-123-def-456; Path=/; SameSite=Strict',
      })
    })

    it('parses cookie with all common attributes', () => {
      const result = parseSetCookie(
        'full=value123; Path=/app; Domain=.example.com; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Max-Age=3600; Secure; HttpOnly; SameSite=Lax',
      )

      expect(result).toEqual({
        name: 'full',
        value:
          'value123; Path=/app; Domain=.example.com; Expires=Wed, 21 Oct 2025 07:28:00 GMT; Max-Age=3600; Secure; HttpOnly; SameSite=Lax',
      })
    })

    it('parses cookie being deleted (Max-Age=0)', () => {
      const result = parseSetCookie('deleted=; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT')

      expect(result).toEqual({
        name: 'deleted',
        value: '; Path=/; Max-Age=0; Expires=Thu, 01 Jan 1970 00:00:00 GMT',
      })
    })
  })

  describe('case sensitivity', () => {
    it('preserves case in cookie name', () => {
      const result = parseSetCookie('SessionID=value')

      expect(result).toEqual({
        name: 'SessionID',
        value: 'value',
      })
    })

    it('preserves case in cookie value', () => {
      const result = parseSetCookie('name=ValueWithCase')

      expect(result).toEqual({
        name: 'name',
        value: 'ValueWithCase',
      })
    })

    it('preserves case in attributes', () => {
      const result = parseSetCookie('name=value; PATH=/; HTTPONLY')

      expect(result).toEqual({
        name: 'name',
        value: 'value; PATH=/; HTTPONLY',
      })
    })
  })
})
