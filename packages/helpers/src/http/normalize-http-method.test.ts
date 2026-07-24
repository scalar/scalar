import { beforeEach, describe, it, expect } from 'vitest'
import { normalizeHttpMethod } from './normalize-http-method'
import { HTTP_METHODS } from './http-methods'
import { consoleWarnSpy } from '@/testing/console-spies'

describe('normalizeHttpMethod', () => {
  beforeEach(() => {
    consoleWarnSpy.mockClear()
  })

  describe('valid HTTP methods', () => {
    it.each(HTTP_METHODS)('should normalize valid HTTP method: %s', (method) => {
      // Test lowercase
      expect(normalizeHttpMethod(method)).toBe(method)
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      // Test uppercase
      expect(normalizeHttpMethod(method.toUpperCase())).toBe(method)
      expect(consoleWarnSpy).not.toHaveBeenCalled()

      // Test mixed case
      expect(normalizeHttpMethod(method.charAt(0).toUpperCase() + method.slice(1))).toBe(method)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle whitespace in valid methods', () => {
      expect(normalizeHttpMethod(' get ')).toBe('get')
      expect(normalizeHttpMethod('\tpost\n')).toBe('post')
      expect(normalizeHttpMethod('  put  ')).toBe('put')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })

  describe('invalid inputs', () => {
    it('should return default method for undefined input', () => {
      expect(normalizeHttpMethod(undefined)).toBe('get')
      expect(consoleWarnSpy).toHaveBeenCalledWith('Request method is not a string. Using get as the default.')
    })

    it('should return default method for non-string inputs', () => {
      const nonStringInputs = [123, true, false, {}, [], () => {}, Symbol('test')]

      nonStringInputs.forEach((input) => {
        expect(normalizeHttpMethod(input as unknown as string)).toBe('get')
        expect(consoleWarnSpy).toHaveBeenCalledWith('Request method is not a string. Using get as the default.')
      })
    })

    it('should preserve custom HTTP method tokens', () => {
      const customMethods = [
        'fetch',
        'request',
        'send',
        'HTTP',
        'GETS',
        'POSTS',
        'PATCHES',
        'DELETES',
        'PUTS',
        'OPTION',
        'HEADER',
        'TRACES',
        'CONNECTS',
        'LIST',
        'COPY',
        'PURGE',
      ]

      customMethods.forEach((method) => {
        expect(normalizeHttpMethod(method)).toBe(method)
      })

      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should handle empty string', () => {
      expect(normalizeHttpMethod('')).toBe('get')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Request method is not a valid request method. Using get as the default.',
      )
    })

    it('should handle whitespace-only strings', () => {
      expect(normalizeHttpMethod('   ')).toBe('get')
      expect(consoleWarnSpy).toHaveBeenCalledWith(
        'Request method is not a valid request method. Using get as the default.',
      )
    })
  })

  describe('edge cases', () => {
    it('should preserve valid HTTP token special characters in custom method names', () => {
      expect(normalizeHttpMethod('get!')).toBe('get!')
      expect(normalizeHttpMethod('put#')).toBe('put#')
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })

    it('should reject malformed custom method names', () => {
      expect(normalizeHttpMethod('post?')).toBe('get')
      expect(normalizeHttpMethod('bad method')).toBe('get')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should handle mixed case with special characters', () => {
      expect(normalizeHttpMethod('GeT!')).toBe('GeT!')
      expect(normalizeHttpMethod('PoSt?')).toBe('get')
      expect(normalizeHttpMethod('PuT#')).toBe('PuT#')
      expect(consoleWarnSpy).toHaveBeenCalled()
    })

    it('should handle very long strings', () => {
      const longString = 'get'.repeat(100)
      expect(normalizeHttpMethod(longString)).toBe(longString)
      expect(consoleWarnSpy).not.toHaveBeenCalled()
    })
  })
})
