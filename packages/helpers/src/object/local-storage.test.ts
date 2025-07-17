import { describe, it, expect, vi, beforeEach } from 'vitest'
import { LS_KEYS, REFERENCE_LS_KEYS, safeLocalStorage } from './local-storage'

describe('local-storage', () => {
  describe('LS_KEYS', () => {
    it('has all expected keys', () => {
      expect(LS_KEYS).toEqual({
        COLLECTION: 'collection',
        COOKIE: 'cookie',
        ENVIRONMENT: 'environment',
        REQUEST: 'request',
        REQUEST_EXAMPLE: 'requestExample',
        SECURITY_SCHEME: 'securityScheme',
        SERVER: 'server',
        TAG: 'tag',
        WORKSPACE: 'workspace',
      })
    })
  })

  describe('REFERENCE_LS_KEYS', () => {
    it('has all expected keys', () => {
      expect(REFERENCE_LS_KEYS).toEqual({
        SELECTED_CLIENT_DEPRECATED: 'scalar-reference-selected-client',
        SELECTED_CLIENT: 'scalar-reference-selected-client-v2',
      })
    })
  })

  describe('safeLocalStorage', () => {
    const originalWindow = global.window
    const originalLocalStorage = global.localStorage

    beforeEach(() => {
      // Reset window and localStorage before each test
      global.window = originalWindow
      global.localStorage = originalLocalStorage
    })

    it('returns null for all methods when window is undefined', () => {
      // @ts-expect-error - Testing SSR environment
      global.window = undefined

      expect(safeLocalStorage().getItem('test')).toBeNull()
      expect(safeLocalStorage().setItem('test', 'value')).toBeNull()
      expect(safeLocalStorage().removeItem('test')).toBeNull()
    })

    it('uses actual localStorage when window is defined', () => {
      const mockLocalStorage = {
        getItem: vi.fn(),
        setItem: vi.fn(),
        removeItem: vi.fn(),
      }

      // @ts-expect-error - Mocking localStorage
      global.localStorage = mockLocalStorage

      safeLocalStorage().getItem('test')
      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('test')

      safeLocalStorage().setItem('test', 'value')
      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('test', 'value')

      safeLocalStorage().removeItem('test')
      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('test')
    })
  })
})
