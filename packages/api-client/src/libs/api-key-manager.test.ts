import { describe, it, expect, beforeEach, vi } from 'vitest'
import {
  saveApiKey,
  getApiKey,
  removeApiKey,
  isApiKeyEnabled,
  getApiKeyValue,
  doesUrlRequireApiKey,
  getApiKeyForUrl,
} from './api-key-manager'

// Mock localStorage
const mockLocalStorage = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
  clear: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: mockLocalStorage,
  writable: true,
})

describe('api-key-manager', () => {
  beforeEach(() => {
    vi.clearAllMocks()
  })

  describe('saveApiKey', () => {
    it('saves API key configuration to localStorage', () => {
      const config = {
        enabled: true,
        key: 'test-key-123',
        description: 'Test API key',
      }

      saveApiKey('workspace-1', config)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('scalar-api-key-workspace-1', JSON.stringify(config))
    })

    it('handles empty workspace ID', () => {
      const config = { enabled: true, key: 'test-key' }

      saveApiKey('', config)

      expect(mockLocalStorage.setItem).toHaveBeenCalledWith('scalar-api-key-', JSON.stringify(config))
    })
  })

  describe('getApiKey', () => {
    it('retrieves API key configuration from localStorage', () => {
      const config = {
        enabled: true,
        key: 'test-key-123',
        description: 'Test API key',
      }

      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKey('workspace-1')

      expect(mockLocalStorage.getItem).toHaveBeenCalledWith('scalar-api-key-workspace-1')
      expect(result).toEqual(config)
    })

    it('returns null for non-existent keys', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getApiKey('non-existent')

      expect(result).toBeNull()
    })

    it('returns null for invalid JSON', () => {
      mockLocalStorage.getItem.mockReturnValue('invalid-json')

      const result = getApiKey('workspace-1')

      expect(result).toBeNull()
    })
  })

  describe('removeApiKey', () => {
    it('removes API key from localStorage', () => {
      removeApiKey('workspace-1')

      expect(mockLocalStorage.removeItem).toHaveBeenCalledWith('scalar-api-key-workspace-1')
    })
  })

  describe('isApiKeyEnabled', () => {
    it('returns true when API key is enabled', () => {
      const config = { enabled: true, key: 'test-key' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = isApiKeyEnabled('workspace-1')

      expect(result).toBe(true)
    })

    it('returns false when API key is disabled', () => {
      const config = { enabled: false, key: 'test-key' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = isApiKeyEnabled('workspace-1')

      expect(result).toBe(false)
    })

    it('returns false when no API key exists', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = isApiKeyEnabled('workspace-1')

      expect(result).toBe(false)
    })
  })

  describe('getApiKeyValue', () => {
    it('returns API key value when enabled and present', () => {
      const config = { enabled: true, key: 'test-key-123' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyValue('workspace-1')

      expect(result).toBe('test-key-123')
    })

    it('returns null when API key is disabled', () => {
      const config = { enabled: false, key: 'test-key-123' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyValue('workspace-1')

      expect(result).toBeNull()
    })

    it('returns null when API key is empty', () => {
      const config = { enabled: true, key: '' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyValue('workspace-1')

      expect(result).toBeNull()
    })

    it('trims whitespace from API key', () => {
      const config = { enabled: true, key: '  test-key-123  ' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyValue('workspace-1')

      expect(result).toBe('test-key-123')
    })
  })

  describe('doesUrlRequireApiKey', () => {
    it('returns true for URLs that require API key', () => {
      expect(doesUrlRequireApiKey('https://pro-api.coingecko.com')).toBe(true)
      expect(doesUrlRequireApiKey('https://pro-api.coinmarketcap.com')).toBe(true)
      expect(doesUrlRequireApiKey('https://pro-api.defillama.com')).toBe(true)
    })

    it('returns true for URLs with paths that require API key', () => {
      expect(doesUrlRequireApiKey('https://pro-api.coingecko.com/api/v3')).toBe(true)
      expect(doesUrlRequireApiKey('https://pro-api.defillama.com/coins/latest')).toBe(true)
    })

    it('returns false for URLs that do not require API key', () => {
      expect(doesUrlRequireApiKey('https://api.github.com')).toBe(false)
      expect(doesUrlRequireApiKey('https://api.example.com')).toBe(false)
      expect(doesUrlRequireApiKey('https://jsonplaceholder.typicode.com')).toBe(false)
    })

    it('returns false for empty or invalid URLs', () => {
      expect(doesUrlRequireApiKey('')).toBe(false)
      expect(doesUrlRequireApiKey('invalid-url')).toBe(false)
    })

    it('handles URLs without protocol', () => {
      expect(doesUrlRequireApiKey('pro-api.coingecko.com')).toBe(true)
      expect(doesUrlRequireApiKey('api.github.com')).toBe(false)
    })

    it('is case insensitive', () => {
      expect(doesUrlRequireApiKey('https://PRO-API.COINGECKO.COM')).toBe(true)
      expect(doesUrlRequireApiKey('HTTPS://pro-api.defillama.com')).toBe(true)
    })
  })

  describe('getApiKeyForUrl', () => {
    it('returns API key for URLs that require it', () => {
      const config = { enabled: true, key: 'test-key-123' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyForUrl('workspace-1', 'https://pro-api.coingecko.com')

      expect(result).toBe('test-key-123')
    })

    it('returns null for URLs that do not require API key', () => {
      const config = { enabled: true, key: 'test-key-123' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyForUrl('workspace-1', 'https://api.github.com')

      expect(result).toBeNull()
    })

    it('returns null when no API key is configured', () => {
      mockLocalStorage.getItem.mockReturnValue(null)

      const result = getApiKeyForUrl('workspace-1', 'https://pro-api.coingecko.com')

      expect(result).toBeNull()
    })

    it('returns null when API key is disabled', () => {
      const config = { enabled: false, key: 'test-key-123' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyForUrl('workspace-1', 'https://pro-api.coingecko.com')

      expect(result).toBeNull()
    })

    it('works with DefLlama Pro API example', () => {
      const config = { enabled: true, key: 'defillama-pro-key' }
      mockLocalStorage.getItem.mockReturnValue(JSON.stringify(config))

      const result = getApiKeyForUrl('workspace-1', 'https://pro-api.defillama.com')

      expect(result).toBe('defillama-pro-key')
    })
  })
})
