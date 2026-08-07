import { describe, expect, it } from 'vitest'

import { isSafeUrl, sanitizeUrl } from './is-safe-url'

describe('is-safe-url', () => {
  describe('isSafeUrl', () => {
    it.each([
      'https://example.com',
      'http://example.com/path?query=1#hash',
      'HTTPS://EXAMPLE.COM',
      'mailto:hello@example.com',
      'tel:+1234567890',
      'ftp://files.example.com/openapi.yaml',
    ])('accepts the absolute url %s', (url) => {
      expect(isSafeUrl(url)).toBe(true)
    })

    it.each(['/openapi.json', './openapi.json', '../openapi.json', 'openapi.json', '#section', '//example.com/path'])(
      'accepts the relative url %s',
      (url) => {
        expect(isSafeUrl(url)).toBe(true)
      },
    )

    it.each([
      'javascript:alert(1)',
      'JavaScript:alert(1)',
      'JAVASCRIPT:alert(document.cookie)',
      'data:text/html;base64,PHNjcmlwdD5hbGVydCgxKTwvc2NyaXB0Pg==',
      'vbscript:msgbox(1)',
      'blob:https://example.com/1234',
      'file:///etc/passwd',
    ])('rejects the dangerous url %s', (url) => {
      expect(isSafeUrl(url)).toBe(false)
    })

    it.each([
      ' javascript:alert(1)',
      'java\tscript:alert(1)',
      'java\nscript:alert(1)',
      'java\rscript:alert(1)',
      'java\u000bscript:alert(1)',
      'java\u0000script:alert(1)',
      'javascript\u007f:alert(1)',
    ])('rejects %j even when it hides control characters', (url) => {
      expect(isSafeUrl(url)).toBe(false)
    })

    it.each([undefined, null, '', '   ', '\t\n'])('rejects the empty value %j', (url) => {
      expect(isSafeUrl(url)).toBe(false)
    })
  })

  describe('sanitizeUrl', () => {
    it('returns the url when it is safe', () => {
      expect(sanitizeUrl('https://example.com')).toBe('https://example.com')
    })

    it('returns the original value verbatim, including characters that are only ignored for the check', () => {
      expect(sanitizeUrl('https://example.com/a b')).toBe('https://example.com/a b')
    })

    it('returns undefined for a dangerous url', () => {
      expect(sanitizeUrl('javascript:alert(1)')).toBeUndefined()
    })

    it('returns undefined for an empty value', () => {
      expect(sanitizeUrl(undefined)).toBeUndefined()
    })
  })
})
