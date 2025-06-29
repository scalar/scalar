import { describe, expect, it } from 'vitest'
import { isUrl } from './is-url'

describe('is-url', () => {
  describe('isUrl', () => {
    it('returns true for valid http URLs', () => {
      expect(isUrl('http://example.com')).toBe(true)
      expect(isUrl('http://api.example.com/path')).toBe(true)
      expect(isUrl('http://localhost:3000')).toBe(true)
      expect(isUrl('http://192.168.1.1')).toBe(true)
    })

    it('returns true for valid https URLs', () => {
      expect(isUrl('https://example.com')).toBe(true)
      expect(isUrl('https://api.example.com/path')).toBe(true)
      expect(isUrl('https://localhost:3000')).toBe(true)
      expect(isUrl('https://192.168.1.1')).toBe(true)
    })

    it('returns false for null input', () => {
      expect(isUrl(null)).toBe(false)
    })

    it('returns false for empty string', () => {
      expect(isUrl('')).toBe(false)
    })

    it('returns false for non-URL strings', () => {
      expect(isUrl('not-a-url')).toBe(false)
      expect(isUrl('example.com')).toBe(false)
      expect(isUrl('ftp://example.com')).toBe(false)
      expect(isUrl('file:///path/to/file')).toBe(false)
      expect(isUrl('mailto:user@example.com')).toBe(false)
    })

    it('returns false for URLs without protocol', () => {
      expect(isUrl('www.example.com')).toBe(false)
      expect(isUrl('example.com/path')).toBe(false)
      expect(isUrl('localhost:3000')).toBe(false)
    })

    it('returns false for malformed URLs', () => {
      expect(isUrl('http:/example.com')).toBe(false)
      expect(isUrl('https:/example.com')).toBe(false)
      expect(isUrl('http:example.com')).toBe(false)
      expect(isUrl('https:example.com')).toBe(false)
    })

    it('returns false for whitespace-only strings', () => {
      expect(isUrl('   ')).toBe(false)
      expect(isUrl('\t')).toBe(false)
      expect(isUrl('\n')).toBe(false)
    })

    it('returns false for strings that start with http but are not URLs', () => {
      expect(isUrl('http://')).toBe(false)
      expect(isUrl('https://')).toBe(false)
      expect(isUrl('http:// ')).toBe(false)
      expect(isUrl('https:// ')).toBe(false)
    })

    it('handles URLs with query parameters and fragments', () => {
      expect(isUrl('http://example.com?param=value')).toBe(true)
      expect(isUrl('https://example.com/path?param=value#fragment')).toBe(true)
      expect(isUrl('http://example.com#fragment')).toBe(true)
    })

    it('handles URLs with special characters', () => {
      expect(isUrl('http://example.com/path with spaces')).toBe(true)
      expect(isUrl('https://example.com/path-with-underscores')).toBe(true)
      expect(isUrl('http://example.com/path.with.dots')).toBe(true)
    })
  })
})
