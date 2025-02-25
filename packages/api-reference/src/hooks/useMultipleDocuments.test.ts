import { useMultipleDocuments } from '@/hooks/useMultipleDocuments'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { ref } from 'vue'

describe('useMultipleDocuments', () => {
  let mockUrl: URL
  let replaceStateSpy: any

  // Common test setup
  beforeEach(() => {
    mockUrl = new URL('http://example.com')
    vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
    replaceStateSpy = vi.spyOn(window.history, 'replaceState').mockImplementation(() => {})
  })

  describe('API selection', () => {
    it('should select API using numeric index from query parameter', () => {
      mockUrl = new URL('http://example.com?api=1')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[1])
    })

    it('should select API using name from query parameter', () => {
      mockUrl = new URL('http://example.com?api=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[1])
    })

    it('should default to first API when query parameter is invalid', () => {
      mockUrl = new URL('http://example.com?api=invalid')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[0])
    })
  })

  describe('URL management', () => {
    it('should update URL when initializing with a selection', () => {
      const multiConfig = {
        configuration: ref([{ spec: { name: 'first-api' } }, { spec: { name: 'second-api' } }]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=first-api')
      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value).toEqual(multiConfig.configuration.value[0])
    })
  })

  describe('edge cases', () => {
    it('should handle single API configuration', () => {
      const singleConfig = {
        configuration: ref({ spec: { name: 'single-api' } }),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(singleConfig)

      expect(availableDocuments.value).toHaveLength(1)
      expect(selectedConfiguration.value).toEqual(singleConfig.configuration.value)
    })

    it('should handle undefined configuration', () => {
      const emptyConfig = {
        configuration: ref(undefined),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(emptyConfig)

      expect(availableDocuments.value).toHaveLength(0)
      expect(selectedConfiguration.value).toBeUndefined()
    })

    it('should filter out APIs with undefined specs', () => {
      const configWithUndefinedSpec = {
        configuration: ref([{ spec: undefined }, { spec: { name: 'valid-api' } }]),
      }

      const { availableDocuments } = useMultipleDocuments(configWithUndefinedSpec)

      expect(availableDocuments.value).toHaveLength(1)
      expect(availableDocuments.value[0].name).toBe('valid-api')
    })
  })
})
