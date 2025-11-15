import type { ResponseInstance } from '@scalar/oas-utils/entities/spec'
import { describe, expect, it } from 'vitest'

import { getContentLength } from './get-content-length'

const getDefaultResponse = (overrides: Partial<ResponseInstance> = {}): ResponseInstance => {
  return {
    ...new Response(),
    headers: {},
    cookieHeaderKeys: [],
    duration: 100,
    method: 'get',
    path: '/',
    reader: new ReadableStreamDefaultReader(new ReadableStream()),
    status: 200,
    statusText: 'OK',
    type: 'basic',
    url: 'https://example.com',
    ...overrides,
  }
}

describe('getContentLength', () => {
  describe('valid content lengths', () => {
    it('formats bytes correctly', () => {
      const response = getDefaultResponse({ headers: { 'Content-Length': '1024' } })
      expect(getContentLength(response)).toBe('1.02 kB')
    })

    it('formats small byte values', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '100' },
      })
      expect(getContentLength(response)).toBe('100 B')
    })

    it('formats kilobytes', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '5000' },
      })
      expect(getContentLength(response)).toBe('5 kB')
    })

    it('formats megabytes', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '1500000' },
      })
      expect(getContentLength(response)).toBe('1.5 MB')
    })

    it('formats gigabytes', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '2500000000' },
      })
      expect(getContentLength(response)).toBe('2.5 GB')
    })

    it('formats single byte', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '1' },
      })
      expect(getContentLength(response)).toBe('1 B')
    })

    it('formats large numbers', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '999999999' },
      })
      expect(getContentLength(response)).toBe('1000 MB')
    })
  })

  describe('case sensitivity', () => {
    it('handles Content-Length with capital letters', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '2048' },
      })
      expect(getContentLength(response)).toBe('2.05 kB')
    })

    it('handles content-length with lowercase letters', () => {
      const response = getDefaultResponse({
        headers: { 'content-length': '2048' },
      })
      expect(getContentLength(response)).toBe('2.05 kB')
    })

    it('prioritizes Content-Length over content-length', () => {
      const response = getDefaultResponse({
        headers: {
          'Content-Length': '1024',
          'content-length': '2048',
        },
      })
      // Should use Content-Length first due to short-circuit evaluation
      expect(getContentLength(response)).toBe('1.02 kB')
    })
  })

  describe('missing or undefined headers', () => {
    it('returns undefined when headers are missing', () => {
      const response = getDefaultResponse()
      expect(getContentLength(response)).toBeUndefined()
    })

    it('returns undefined when headers object is empty', () => {
      const response = getDefaultResponse({
        headers: {},
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('returns undefined when content-length is not present', () => {
      const response = getDefaultResponse({
        headers: {
          'Content-Type': 'application/json',
        },
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('returns undefined when headers is undefined', () => {
      const response = getDefaultResponse({
        headers: undefined,
      })
      expect(getContentLength(response)).toBeUndefined()
    })
  })

  describe('zero and empty values', () => {
    it('returns undefined for zero content length', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '0' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('returns undefined for empty string', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })
  })

  describe('invalid values', () => {
    it('returns undefined for non-numeric string', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': 'invalid' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('returns undefined for negative numbers', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '-100' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('parses numeric string with leading zeros', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '001024' },
      })
      expect(getContentLength(response)).toBe('1.02 kB')
    })

    it('returns undefined for decimal numbers', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '100.5' },
      })
      // parseInt will parse as 100
      expect(getContentLength(response)).toBe('100 B')
    })

    it('returns undefined for NaN', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': 'NaN' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })

    it('handles whitespace in value', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '  1024  ' },
      })
      expect(getContentLength(response)).toBe('1.02 kB')
    })

    it('parses numbers with trailing non-numeric characters', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '1024bytes' },
      })
      // parseInt will parse the numeric part
      expect(getContentLength(response)).toBe('1.02 kB')
    })

    it('returns undefined for strings starting with non-numeric characters', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': 'bytes1024' },
      })
      expect(getContentLength(response)).toBeUndefined()
    })
  })

  describe('edge cases', () => {
    it('handles very large numbers', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '9999999999999' },
      })
      expect(getContentLength(response)).toBe('10 TB')
    })

    it('handles maximum safe integer', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '9007199254740991' },
      })
      // This is Number.MAX_SAFE_INTEGER
      expect(getContentLength(response)).toBe('9.01 PB')
    })

    it('handles scientific notation', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '1e6' },
      })
      // parseInt will parse as 1
      expect(getContentLength(response)).toBe('1 B')
    })

    it('handles hexadecimal strings', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '0x400' },
      })
      // parseInt with radix 10 will parse as 0
      expect(getContentLength(response)).toBeUndefined()
    })
  })

  describe('real-world scenarios', () => {
    it('handles typical JSON response size', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '3456' },
      })
      expect(getContentLength(response)).toBe('3.46 kB')
    })

    it('handles typical image file size', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '245678' },
      })
      expect(getContentLength(response)).toBe('246 kB')
    })

    it('handles typical video file size', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '52428800' },
      })
      expect(getContentLength(response)).toBe('52.4 MB')
    })

    it('handles small API response', () => {
      const response = getDefaultResponse({
        headers: { 'Content-Length': '42' },
      })
      expect(getContentLength(response)).toBe('42 B')
    })

    it('handles response with multiple headers', () => {
      const response = getDefaultResponse({
        headers: {
          'Content-Type': 'application/json',
          'Content-Length': '1500',
          'Cache-Control': 'no-cache',
          'X-Custom-Header': 'value',
        },
      })
      expect(getContentLength(response)).toBe('1.5 kB')
    })
  })
})
