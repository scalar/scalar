import { describe, it, expect } from 'vitest'
import { canMethodHaveBody } from './can-method-have-body'
import type { HttpMethod } from './http-methods'

describe('can-method-have-body', () => {
  describe('HTTP methods with body support', () => {
    it.each(['post', 'put', 'patch', 'delete'] as const)('returns true for %s method', (method) => {
      expect(canMethodHaveBody(method)).toBe(true)
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE'] as const)('handles uppercase %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(true)
    })

    it.each(['Post', 'Put', 'Patch', 'Delete'] as const)('handles mixed case %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(true)
    })
  })

  describe('HTTP methods without body support', () => {
    it.each(['get', 'head', 'options', 'trace'] as const)('returns false for %s method', (method) => {
      expect(canMethodHaveBody(method)).toBe(false)
    })

    it.each(['GET', 'HEAD', 'OPTIONS', 'TRACE'] as const)('handles uppercase %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(false)
    })

    it.each(['Get', 'Head', 'Options', 'Trace'] as const)('handles mixed case %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(false)
    })
  })

  describe('type narrowing', () => {
    it('narrows type to BodyMethod when true is returned', () => {
      const method: HttpMethod = 'post'
      if (canMethodHaveBody(method)) {
        // TypeScript should know that method is now BodyMethod
        expect(method).toBe('post')
      }
    })

    it('preserves original type when false is returned', () => {
      const method: HttpMethod = 'get'
      if (!canMethodHaveBody(method)) {
        // TypeScript should know that method is still HttpMethod
        expect(method).toBe('get')
      }
    })
  })

  describe('edge cases', () => {
    it('handles empty string', () => {
      expect(canMethodHaveBody('' as HttpMethod)).toBe(false)
    })

    it('handles invalid HTTP methods', () => {
      expect(canMethodHaveBody('invalid' as HttpMethod)).toBe(false)
    })

    it('handles whitespace-only strings', () => {
      expect(canMethodHaveBody('   ' as HttpMethod)).toBe(false)
    })
  })
})
