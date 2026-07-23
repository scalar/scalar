import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

import { buildSafeBodyRequest, canMethodHaveBody } from './can-method-have-body'
import type { HttpMethod } from './http-methods'

vi.mock('@/general/is-electron', () => ({
  isElectron: vi.fn(() => false),
}))

const { isElectron } = await import('@/general/is-electron')
const mockedIsElectron = vi.mocked(isElectron)

describe('can-method-have-body', () => {
  beforeEach(() => {
    mockedIsElectron.mockReturnValue(false)
  })

  afterEach(() => {
    vi.clearAllMocks()
  })

  describe('HTTP methods with body support', () => {
    it.each(['post', 'put', 'patch', 'delete', 'query'] as const)('returns true for %s method', (method) => {
      expect(canMethodHaveBody(method)).toBe(true)
    })

    it.each(['POST', 'PUT', 'PATCH', 'DELETE', 'QUERY'] as const)('handles uppercase %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(true)
    })

    it.each(['Post', 'Put', 'Patch', 'Delete', 'Query'] as const)('handles mixed case %s method', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(true)
    })
  })

  describe('QUERY method', () => {
    it('can have a body because the query is carried in the request body', () => {
      expect(canMethodHaveBody('query')).toBe(true)
    })

    it('keeps the body when building a safe request', () => {
      const request = buildSafeBodyRequest('https://example.com/search', {
        method: 'QUERY',
        body: 'q=scalar',
      })

      expect(request.method).toBe('QUERY')
      expect(request.body).not.toBeNull()
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

  describe('Electron environment', () => {
    beforeEach(() => {
      mockedIsElectron.mockReturnValue(true)
    })

    it.each(['get', 'GET', 'Get'] as const)('returns true for %s method in Electron', (method) => {
      expect(canMethodHaveBody(method as HttpMethod)).toBe(true)
    })

    it.each(['post', 'put', 'patch', 'delete'] as const)('still returns true for %s method in Electron', (method) => {
      expect(canMethodHaveBody(method)).toBe(true)
    })
  })

  describe('return type', () => {
    it('returns a plain boolean so the original HttpMethod type is preserved in both branches', () => {
      const method: HttpMethod = 'get'

      if (canMethodHaveBody(method)) {
        expect<HttpMethod>(method).toBe('get')
      } else {
        expect<HttpMethod>(method).toBe('get')
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
