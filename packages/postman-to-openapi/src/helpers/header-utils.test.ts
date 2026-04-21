import { describe, expect, it } from 'vitest'

import { parseMediaType, pickAcceptMediaType, readHeader } from './header-utils'

describe('header-utils', () => {
  describe('readHeader', () => {
    it('finds a header case-insensitively', () => {
      const headers = [
        { key: 'Content-Type', value: 'application/json' },
        { key: 'X-Request-Id', value: 'abc' },
      ]
      expect(readHeader(headers, 'content-type')).toBe('application/json')
      expect(readHeader(headers, 'CONTENT-TYPE')).toBe('application/json')
    })

    it('returns undefined when the header is missing', () => {
      expect(readHeader([{ key: 'X-Other', value: 'x' }], 'Content-Type')).toBeUndefined()
    })

    it('skips disabled headers', () => {
      const headers = [{ key: 'Content-Type', value: 'application/json', disabled: true }]
      expect(readHeader(headers, 'Content-Type')).toBeUndefined()
    })

    it('returns undefined for string-typed or missing header lists', () => {
      expect(readHeader('Content-Type: application/json', 'Content-Type')).toBeUndefined()
      expect(readHeader(undefined, 'Content-Type')).toBeUndefined()
      expect(readHeader(null, 'Content-Type')).toBeUndefined()
    })
  })

  describe('parseMediaType', () => {
    it('strips parameters like charset', () => {
      expect(parseMediaType('application/json; charset=utf-8')).toBe('application/json')
    })

    it('lowercases the media type', () => {
      expect(parseMediaType('Application/JSON')).toBe('application/json')
    })

    it('returns undefined for empty input', () => {
      expect(parseMediaType(undefined)).toBeUndefined()
      expect(parseMediaType('')).toBeUndefined()
      expect(parseMediaType('   ')).toBeUndefined()
    })
  })

  describe('pickAcceptMediaType', () => {
    it('prefers application/json when present', () => {
      expect(pickAcceptMediaType('text/html, application/json;q=0.9')).toBe('application/json')
    })

    it('returns the first non-wildcard type otherwise', () => {
      expect(pickAcceptMediaType('text/html, text/csv')).toBe('text/html')
    })

    it('ignores wildcard-only values', () => {
      expect(pickAcceptMediaType('*/*')).toBeUndefined()
    })

    it('ignores wildcards mixed with real types', () => {
      expect(pickAcceptMediaType('*/*, application/xml')).toBe('application/xml')
    })

    it('returns undefined for empty input', () => {
      expect(pickAcceptMediaType(undefined)).toBeUndefined()
      expect(pickAcceptMediaType('')).toBeUndefined()
    })
  })
})
