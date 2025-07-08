import { describe, expect, it, beforeEach, vi, afterEach } from 'vitest'
import { BLOCK_STORE_LS_KEY, blockStore } from './block-store'
import type { AvailableClients } from '@scalar/snippetz'

// Mock localStorage
const localStorageMock = {
  getItem: vi.fn(),
  setItem: vi.fn(),
  removeItem: vi.fn(),
}

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock,
  writable: true,
})

describe('blockStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    blockStore.setState('selectedClient', null)
    // Clear all mocks
    vi.clearAllMocks()
    vi.useFakeTimers()
  })

  afterEach(() => {
    vi.useRealTimers()
    blockStore._resetRestored()
  })

  describe('initial state', () => {
    it('should have selectedClient set to null initially', () => {
      expect(blockStore.getState('selectedClient')).toBeNull()
    })

    it('should return the entire state when no key is provided', () => {
      const state = blockStore.getState()
      expect(state).toHaveProperty('selectedClient')
      expect(state.selectedClient).toBeNull()
    })
  })

  describe('setState and getState', () => {
    it('should accept valid client values', () => {
      const validClients: AvailableClients[number][] = [
        'js/fetch',
        'js/axios',
        'python/requests',
        'shell/curl',
        'node/fetch',
        'go/native',
        'csharp/httpclient',
        'java/okhttp',
        'php/curl',
        'ruby/native',
      ]

      validClients.forEach((client) => {
        blockStore.setState('selectedClient', client)
        expect(blockStore.getState('selectedClient')).toBe(client)
      })
    })

    it('should accept null value', () => {
      blockStore.setState('selectedClient', 'js/fetch')
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')

      blockStore.setState('selectedClient', null)
      expect(blockStore.getState('selectedClient')).toBeNull()
    })

    it('should maintain reactivity when values change', () => {
      // Set initial value
      blockStore.setState('selectedClient', 'js/fetch')
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')

      // Change to different value
      blockStore.setState('selectedClient', 'python/requests')
      expect(blockStore.getState('selectedClient')).toBe('python/requests')

      // Change to null
      blockStore.setState('selectedClient', null)
      expect(blockStore.getState('selectedClient')).toBeNull()

      // Change back to a value
      blockStore.setState('selectedClient', 'shell/curl')
      expect(blockStore.getState('selectedClient')).toBe('shell/curl')
    })
  })

  describe('store structure', () => {
    it('should allow type-safe assignment', () => {
      // This test ensures TypeScript types are working correctly
      const testClient: AvailableClients[number] = 'js/fetch'
      blockStore.setState('selectedClient', testClient)
      expect(blockStore.getState()).toEqual({ selectedClient: testClient })

      // @ts-expect-error - cannot set read only property
      blockStore.getState().selectedClient = 'js/fetch'
    })
  })

  describe('localStorage integration', () => {
    it('should save state to localStorage when setState is called', async () => {
      blockStore.setState('selectedClient', 'js/fetch')

      // Wait for debounced save
      vi.runAllTimers()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        BLOCK_STORE_LS_KEY,
        JSON.stringify({ selectedClient: 'js/fetch' }),
      )
    })

    it('should save multiple state changes to localStorage', async () => {
      blockStore.setState('selectedClient', 'js/fetch')
      blockStore.setState('selectedClient', 'python/requests')
      blockStore.setState('selectedClient', 'shell/curl')

      // Wait for debounced save
      vi.runAllTimers()

      expect(localStorageMock.setItem).toHaveBeenCalledWith(
        BLOCK_STORE_LS_KEY,
        JSON.stringify({ selectedClient: 'shell/curl' }),
      )
    })

    it('should restore state from localStorage on first call', () => {
      const mockStoredState = { selectedClient: 'python/requests' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredState))

      // Set initial state
      blockStore.setState('selectedClient', 'js/fetch')
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')

      // Restore from localStorage
      blockStore.restoreState()
      expect(blockStore.getState('selectedClient')).toBe('python/requests')
      expect(localStorageMock.getItem).toHaveBeenCalledWith(BLOCK_STORE_LS_KEY)
    })

    it('should not restore state on subsequent restoreState calls', () => {
      const mockStoredState = { selectedClient: 'python/requests' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredState))

      // First call should restore
      blockStore.restoreState()
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1)

      // Second call should not restore
      blockStore.restoreState()
      expect(localStorageMock.getItem).toHaveBeenCalledTimes(1)
    })

    it('should handle empty localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue(null)

      blockStore.setState('selectedClient', 'js/fetch')
      blockStore.restoreState()

      // State should remain unchanged
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')
      expect(localStorageMock.getItem).toHaveBeenCalledWith(BLOCK_STORE_LS_KEY)
    })

    it('should handle invalid JSON in localStorage gracefully', () => {
      localStorageMock.getItem.mockReturnValue('invalid-json')

      blockStore.setState('selectedClient', 'js/fetch')

      // Should not throw error and should keep current state
      expect(() => blockStore.restoreState()).not.toThrow()
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')
    })

    it('should handle missing localStorage gracefully', () => {
      // Mock localStorage to throw error (simulating private browsing)
      const originalLocalStorage = window.localStorage
      Object.defineProperty(window, 'localStorage', {
        value: {
          getItem: vi.fn(() => {
            throw new Error('localStorage not available')
          }),
          setItem: vi.fn(() => {
            throw new Error('localStorage not available')
          }),
        },
        writable: true,
      })

      // Should not throw error
      expect(() => blockStore.setState('selectedClient', 'js/fetch')).not.toThrow()
      expect(() => blockStore.restoreState()).not.toThrow()

      // Restore original localStorage
      Object.defineProperty(window, 'localStorage', {
        value: originalLocalStorage,
        writable: true,
      })
    })
  })

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      const clients: AvailableClients[number][] = ['js/fetch', 'python/requests', 'shell/curl', 'node/axios']

      clients.forEach((client, index) => {
        blockStore.setState('selectedClient', client)
        expect(blockStore.getState('selectedClient')).toBe(client)

        // Verify the value persists after assignment
        expect(blockStore.getState('selectedClient')).toBe(clients[index])
      })
    })

    it('should handle null values in localStorage', () => {
      const mockStoredState = { selectedClient: null }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredState))

      blockStore.restoreState()
      expect(blockStore.getState('selectedClient')).toBeNull()
    })

    it('should handle partial state restoration', () => {
      const mockStoredState = { selectedClient: 'js/fetch' }
      localStorageMock.getItem.mockReturnValue(JSON.stringify(mockStoredState))

      blockStore.restoreState()
      expect(blockStore.getState('selectedClient')).toBe('js/fetch')
    })
  })
})
