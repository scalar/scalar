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

  describe('document selection', () => {
    it('should select document using numeric index from query parameter', () => {
      mockUrl = new URL('http://example.com?api=1')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([
          { spec: { url: '/openapi.json', slug: 'first-api' } },
          { spec: { url: '/openapi-2.yaml', slug: 'second-api' } },
        ]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value.spec).toEqual(multiConfig.configuration.value[1].spec)
    })

    it('should select document using slug from query parameter', () => {
      mockUrl = new URL('http://example.com?api=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([
          { spec: { url: '/openapi.json', slug: 'first-api' } },
          { spec: { url: '/openapi-2.yaml', slug: 'second-api' } },
        ]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value.spec).toEqual(multiConfig.configuration.value[1].spec)
    })

    it('should default to first API when query parameter is invalid', () => {
      mockUrl = new URL('http://example.com?api=invalid')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref([{ spec: { slug: 'first-api' } }, { spec: { slug: 'second-api' } }]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value.spec).toEqual(multiConfig.configuration.value[0].spec)
    })

    it('omits sources without url and content', () => {
      const multiConfig = {
        configuration: ref({ spec: { sources: [{}] } }),
      }

      const { availableDocuments } = useMultipleDocuments(multiConfig)
      expect(availableDocuments.value).toHaveLength(0)
    })
  })

  describe('URL management', () => {
    it('should update URL when initializing with a selection', () => {
      const multiConfig = {
        configuration: ref([
          { spec: { url: '/openapi.json', slug: 'first-api' } },
          { spec: { url: '/openapi-2.yaml', slug: 'second-api' } },
        ]),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=first-api')
      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value.spec).toEqual(multiConfig.configuration.value[0].spec)
    })

    it('should not update URL when there is only one document', () => {
      const singleConfig = {
        configuration: ref([{ spec: { url: '/openapi.json', slug: 'single-api' } }]),
      }

      useMultipleDocuments(singleConfig)

      expect(replaceStateSpy).not.toHaveBeenCalled()
    })
  })

  describe('edge cases', () => {
    it('should handle single API configuration', () => {
      const singleConfig = {
        configuration: ref({ spec: { url: '/openapi.json', slug: 'single-api' } }),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(singleConfig)

      expect(availableDocuments.value).toHaveLength(1)
      expect(selectedConfiguration.value.spec).toEqual(singleConfig.configuration.value.spec)
    })

    it('should handle undefined configuration', () => {
      const emptyConfig = {
        configuration: ref(undefined),
      }

      const { selectedConfiguration, availableDocuments } = useMultipleDocuments(emptyConfig)

      expect(availableDocuments.value).toHaveLength(0)
      expect(selectedConfiguration.value).toEqual({
        hideClientButton: false,
        showSidebar: true,
        theme: 'default',
        layout: 'modern',
        isEditable: false,
        hideModels: false,
        hideDownloadButton: false,
        hideTestRequestButton: false,
        hideSearch: false,
        hideDarkModeToggle: false,
        withDefaultFonts: true,
      })
    })

    it('should filter out APIs with undefined sources/url/content', () => {
      const configWithUndefinedSpec = {
        configuration: ref([{ spec: undefined }, { spec: { slug: 'valid-api' } }]),
      }

      const { availableDocuments } = useMultipleDocuments(configWithUndefinedSpec)

      expect(availableDocuments.value).toHaveLength(0)
    })
  })

  describe('multiple sources', () => {
    it('should select API using numeric index from query parameter', () => {
      mockUrl = new URL('http://example.com?api=1')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
              },
            ],
          },
        }),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value.spec).toEqual({
        url: '/openapi-2.yaml',
        slug: 'second-api',
      })
    })

    it('should select API using slug from query parameter', () => {
      mockUrl = new URL('http://example.com?api=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
              },
            ],
          },
        }),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(1)
      expect(selectedConfiguration.value.spec).toEqual({
        url: '/openapi-2.yaml',
        slug: 'second-api',
      })
    })

    it('should default to first API if query parameter is invalid', () => {
      mockUrl = new URL('http://example.com?api=invalid-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
              },
            ],
          },
        }),
      }

      const { selectedDocumentIndex, selectedConfiguration } = useMultipleDocuments(multiConfig)

      expect(selectedDocumentIndex.value).toBe(0)
      expect(selectedConfiguration.value.spec).toEqual({
        url: '/openapi-1.yaml',
        slug: 'first-api',
      })
    })

    it('should update URL when selection changes', async () => {
      mockUrl = new URL('http://example.com')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)
      const replaceStateSpy = vi.spyOn(window.history, 'replaceState')

      const multiConfig = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'first-api',
              },
              {
                url: '/openapi-2.yaml',
                slug: 'second-api',
              },
            ],
          },
        }),
      }

      const { selectedDocumentIndex } = useMultipleDocuments(multiConfig)

      selectedDocumentIndex.value = 1

      expect(replaceStateSpy).toHaveBeenCalledWith({}, '', 'http://example.com/?api=second-api')
    })

    it('should filter out undefined sources', () => {
      const configWithUndefinedSource = {
        configuration: ref({
          spec: {
            sources: [
              undefined,
              {
                url: '/openapi.yaml',
                slug: 'valid-api',
              },
            ],
          },
        }),
      }

      // @ts-expect-error This is a test for the edge case
      const { availableDocuments } = useMultipleDocuments(configWithUndefinedSource)

      expect(availableDocuments.value).toHaveLength(1)
      expect(availableDocuments.value[0].slug).toBe('valid-api')
    })
  })

  describe('title and slug handling', () => {
    it('should generate slug from title if only title exists', () => {
      const config = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                title: 'My Cool API',
              },
            ],
          },
        }),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'My Cool API',
        slug: 'my-cool-api',
      })
    })

    it('should use slug as title if only slug exists', () => {
      const config = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                slug: 'my-api',
              },
            ],
          },
        }),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'my-api',
        slug: 'my-api',
      })
    })

    it('should generate both title and slug from index if neither exists', () => {
      const config = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
              },
              {
                url: '/openapi-2.yaml',
              },
            ],
          },
        }),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'API #1',
        slug: 'api-1',
      })
      expect(availableDocuments.value[1]).toMatchObject({
        title: 'API #2',
        slug: 'api-2',
      })
    })

    it('should preserve existing slug when title is present', () => {
      const config = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                title: 'My Cool API',
                slug: 'custom-slug',
              },
            ],
          },
        }),
      }

      const { availableDocuments } = useMultipleDocuments(config)

      expect(availableDocuments.value[0]).toMatchObject({
        title: 'My Cool API',
        slug: 'custom-slug',
      })
    })
  })

  describe('slugs', () => {
    it('generates slugs from the title', () => {
      mockUrl = new URL('http://example.com?slug=second-api')
      vi.spyOn(window, 'location', 'get').mockReturnValue(mockUrl as any)

      const multiConfig = {
        configuration: ref({
          spec: {
            sources: [
              {
                url: '/openapi-1.yaml',
                title: 'First API',
              },
              {
                url: '/openapi-2.yaml',
                title: 'Second API',
              },
            ],
          },
        }),
      }

      const { availableDocuments } = useMultipleDocuments(multiConfig)

      expect(availableDocuments.value[0].slug).toBe('first-api')
      expect(availableDocuments.value[1].slug).toBe('second-api')
      expect(availableDocuments.value[0].title).toBe('First API')
      expect(availableDocuments.value[1].title).toBe('Second API')
    })
  })
})
