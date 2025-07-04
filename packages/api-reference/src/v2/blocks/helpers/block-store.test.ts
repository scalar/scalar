import { describe, expect, it, beforeEach } from 'vitest'
import { blockStore } from './block-store'
import type { AvailableClients } from '@scalar/snippetz'

describe('blockStore', () => {
  beforeEach(() => {
    // Reset the store to its initial state before each test
    blockStore.selectedClient = null
  })

  describe('initial state', () => {
    it('should have selectedClient set to null initially', () => {
      expect(blockStore.selectedClient).toBeNull()
    })

    it('should be a reactive object', () => {
      expect(blockStore).toBeDefined()
      expect(typeof blockStore).toBe('object')
      expect(blockStore).toHaveProperty('selectedClient')
    })
  })

  describe('selectedClient property', () => {
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
        blockStore.selectedClient = client
        expect(blockStore.selectedClient).toBe(client)
      })
    })

    it('should accept null value', () => {
      blockStore.selectedClient = 'js/fetch'
      expect(blockStore.selectedClient).toBe('js/fetch')

      blockStore.selectedClient = null
      expect(blockStore.selectedClient).toBeNull()
    })

    it('should maintain reactivity when values change', () => {
      // Set initial value
      blockStore.selectedClient = 'js/fetch'
      expect(blockStore.selectedClient).toBe('js/fetch')

      // Change to different value
      blockStore.selectedClient = 'python/requests'
      expect(blockStore.selectedClient).toBe('python/requests')

      // Change to null
      blockStore.selectedClient = null
      expect(blockStore.selectedClient).toBeNull()

      // Change back to a value
      blockStore.selectedClient = 'shell/curl'
      expect(blockStore.selectedClient).toBe('shell/curl')
    })
  })

  describe('store structure', () => {
    it('should have the correct structure', () => {
      expect(blockStore).toHaveProperty('selectedClient')
      expect(Object.keys(blockStore)).toHaveLength(1)
    })

    it('should allow type-safe assignment', () => {
      // This test ensures TypeScript types are working correctly
      const testClient: AvailableClients[number] = 'js/fetch'
      blockStore.selectedClient = testClient
      expect(blockStore.selectedClient).toBe(testClient)
    })
  })

  describe('edge cases', () => {
    it('should handle rapid state changes', () => {
      const clients: AvailableClients[number][] = ['js/fetch', 'python/requests', 'shell/curl', 'node/axios']

      clients.forEach((client, index) => {
        blockStore.selectedClient = client
        expect(blockStore.selectedClient).toBe(client)

        // Verify the value persists after assignment
        expect(blockStore.selectedClient).toBe(clients[index])
      })
    })
  })
})
