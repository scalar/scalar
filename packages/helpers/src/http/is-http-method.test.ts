import { describe, it, expect } from 'vitest'
import { isHttpMethod } from './is-http-method'
import { HTTP_METHODS } from './http-methods'

describe('isHttpMethod', () => {
  describe('valid HTTP methods', () => {
    it.each(HTTP_METHODS)('should return true for valid HTTP method: %s', (method) => {
      expect(isHttpMethod(method)).toBe(true)
    })

    it.each(HTTP_METHODS)('should be case insensitive for method: %s', (method) => {
      expect(isHttpMethod(method.toUpperCase())).toBe(true)
      expect(isHttpMethod(method.toLowerCase())).toBe(true)
      expect(isHttpMethod(method.charAt(0).toUpperCase() + method.slice(1))).toBe(true)
    })
  })

  describe('invalid inputs', () => {
    it('should return false for undefined input', () => {
      expect(isHttpMethod(undefined)).toBe(false)
    })

    it('should return false for empty string', () => {
      expect(isHttpMethod('')).toBe(false)
    })

    it('should return false for non-HTTP methods', () => {
      const invalidMethods = [
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
      ]

      invalidMethods.forEach((method) => {
        expect(isHttpMethod(method)).toBe(false)
      })
    })

    it('should return false for null', () => {
      expect(isHttpMethod(null as unknown as string)).toBe(false)
    })

    it('should return false for non-string inputs', () => {
      const nonStringInputs = [123, true, false, {}, [], () => {}, Symbol('test')]

      nonStringInputs.forEach((input) => {
        expect(isHttpMethod(input as unknown as string)).toBe(false)
      })
    })
  })

  describe('edge cases', () => {
    it('should handle whitespace correctly', () => {
      expect(isHttpMethod(' get ')).toBe(false)
      expect(isHttpMethod('post\n')).toBe(false)
      expect(isHttpMethod('\tput')).toBe(false)
    })

    it('should handle special characters', () => {
      expect(isHttpMethod('get!')).toBe(false)
      expect(isHttpMethod('post?')).toBe(false)
      expect(isHttpMethod('put#')).toBe(false)
    })

    it('should handle mixed case with special characters', () => {
      expect(isHttpMethod('GeT!')).toBe(false)
      expect(isHttpMethod('PoSt?')).toBe(false)
      expect(isHttpMethod('PuT#')).toBe(false)
    })
  })
})
