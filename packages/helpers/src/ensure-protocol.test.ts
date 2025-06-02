import { describe, expect, it } from 'vitest'

import { ensureProtocol } from './ensure-protocol'

describe('ensureProtocol', () => {
  describe('URLs with existing protocols', () => {
    it('preserves http protocol', () => {
      expect(ensureProtocol('http://example.com')).toBe('http://example.com')
    })

    it('preserves https protocol', () => {
      expect(ensureProtocol('https://example.com')).toBe('https://example.com')
    })

    it('preserves ws protocol', () => {
      expect(ensureProtocol('ws://example.com')).toBe('ws://example.com')
    })

    it('preserves wss protocol', () => {
      expect(ensureProtocol('wss://example.com')).toBe('wss://example.com')
    })

    it('preserves file protocol', () => {
      expect(ensureProtocol('file:///path/to/file')).toBe('file:///path/to/file')
    })
  })

  describe('URLs without protocols', () => {
    it('adds http protocol to domain', () => {
      expect(ensureProtocol('example.com')).toBe('http://example.com')
    })

    it('adds http protocol to domain with path', () => {
      expect(ensureProtocol('example.com/path')).toBe('http://example.com/path')
    })

    it('adds http protocol to domain with query', () => {
      expect(ensureProtocol('example.com?query=1')).toBe('http://example.com?query=1')
    })

    it('adds http protocol to domain with port', () => {
      expect(ensureProtocol('example.com:8080')).toBe('http://example.com:8080')
    })

    it('adds http protocol to localhost', () => {
      expect(ensureProtocol('localhost:3000')).toBe('http://localhost:3000')
    })
  })

  describe('template variables', () => {
    it('prepends http:// to template variables', () => {
      expect(ensureProtocol('{protocol}://example.com')).toBe('http://{protocol}://example.com')
    })

    it('preserves path templates', () => {
      expect(ensureProtocol('/api/{version}')).toBe('http://api/{version}')
    })

    it('prepends http:// to full URL templates', () => {
      expect(ensureProtocol('{protocol}://{host}/{path}')).toBe('http://{protocol}://{host}/{path}')
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(ensureProtocol('')).toBe('http://')
    })

    it('prepends http:// to invalid URLs', () => {
      expect(ensureProtocol('not://valid')).toBe('http://not://valid')
    })

    it('handles URLs with authentication', () => {
      expect(ensureProtocol('user:pass@example.com')).toBe('http://user:pass@example.com')
    })

    it('handles IP addresses', () => {
      expect(ensureProtocol('127.0.0.1')).toBe('http://127.0.0.1')
    })

    it('handles IPv6 addresses', () => {
      expect(ensureProtocol('[::1]')).toBe('http://[::1]')
    })

    it('handles URLs with fragments', () => {
      expect(ensureProtocol('example.com#section')).toBe('http://example.com#section')
    })
  })
})
